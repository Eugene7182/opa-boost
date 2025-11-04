"""Seed demo data for OPPO KZ platform."""
from __future__ import annotations

from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import BonusNetwork, BonusOverachievementTier, Network, Product, PromoterPlan, Region, Store, User, UserProfile, UserRole
from app.services.security import hash_password


def ensure_user(session: Session, email: str, role: UserRole) -> User:
    user = session.query(User).filter(User.email == email).one_or_none()
    if user:
        return user
    user = User(email=email, full_name=email.split("@")[0], hashed_password=hash_password("changeme"), role=role)
    session.add(user)
    session.flush()
    profile = UserProfile(user_id=user.id, locale="ru", theme="light")
    session.add(profile)
    return user


def seed() -> None:
    engine = create_engine(settings.database_url)
    with Session(engine) as session:
        networks = {}
        for code in ["MECHTA", "TECHNODOM", "BEELINE"]:
            network = session.query(Network).filter(Network.code == code).one_or_none()
            if not network:
                network = Network(code=code, name=code.title())
                session.add(network)
                session.flush()
            networks[code] = network

        region = session.query(Region).filter(Region.name == "Алматы").one_or_none()
        if not region:
            region = Region(name="Алматы")
            session.add(region)
            session.flush()

        store = session.query(Store).filter(Store.name == "MECHTA Dostyk").one_or_none()
        if not store:
            store = Store(name="MECHTA Dostyk", network_id=networks["MECHTA"].id, region_id=region.id)
            session.add(store)
            session.flush()

        products: list[Product] = []
        for name, sku in [("Reno 14 5G", "reno14-256"), ("Reno 14 Pro", "reno14pro-512")]:
            product = session.query(Product).filter(Product.sku == sku).one_or_none()
            if not product:
                product = Product(name=name, sku=sku)
                session.add(product)
                session.flush()
            products.append(product)

        admin = ensure_user(session, "admin@oppo.kz", UserRole.ADMIN)
        supervisor = ensure_user(session, "supervisor@oppo.kz", UserRole.SUPERVISOR)
        promoter = ensure_user(session, "promoter@oppo.kz", UserRole.PROMOTER)

        today = date.today().replace(day=1)
        plan = session.query(PromoterPlan).filter(
            PromoterPlan.promoter_id == promoter.id,
            PromoterPlan.network_id == networks["MECHTA"].id,
            PromoterPlan.month_start == today,
        ).one_or_none()
        if not plan:
            plan = PromoterPlan(promoter_id=promoter.id, network_id=networks["MECHTA"].id, month_start=today, target_qty=50)
            session.add(plan)

        for network in networks.values():
            for product in products:
                bonus = session.query(BonusNetwork).filter(
                    BonusNetwork.network_id == network.id,
                    BonusNetwork.product_id == product.id,
                    BonusNetwork.memory_gb == 256,
                ).one_or_none()
                if not bonus:
                    bonus = BonusNetwork(
                        network_id=network.id,
                        product_id=product.id,
                        memory_gb=256,
                        base_bonus=9000,
                    )
                    session.add(bonus)
                for idx, (min_percent, max_percent, bonus_amount) in enumerate(
                    [(101, 110, 20000), (111, 120, 30000), (121, 130, 60000), (131, None, 80000)]
                ):
                    tier = session.query(BonusOverachievementTier).filter(
                        BonusOverachievementTier.network_id == network.id,
                        BonusOverachievementTier.min_percent == min_percent,
                        BonusOverachievementTier.max_percent == max_percent,
                    ).one_or_none()
                    if not tier:
                        tier = BonusOverachievementTier(
                            network_id=network.id,
                            min_percent=min_percent,
                            max_percent=max_percent,
                            bonus_amount=bonus_amount,
                        )
                        session.add(tier)

        session.commit()
        print("Demo data seeded")


if __name__ == "__main__":
    seed()
