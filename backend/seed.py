"""
Database seeding script to populate initial data.
"""
from sqlmodel import Session, select, func
from database import engine, init_db
from models.employee import Employee


def seed_employees() -> None:
    """
    Seed the database with initial employee data.
    Only seeds if the database is empty.
    """
    init_db()
    with Session(engine) as session:
        existing = session.exec(select(func.count()).select_from(Employee)).one()
        if existing:
            print("Database already contains data. Skipping seed.")
            return
        
        seed_employees = [
            Employee(
                org_id="org-1",
                first_name="Amelia",
                last_name="Last",
                department="asd",
                position="Assistant Manager",
                location="Singapore",
                status="Active",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Ana",
                last_name="Test",
                department="No department",
                position="No position",
                location="No location",
                status="Active",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Arlani",
                last_name="Sosaia",
                department="No department",
                position="No position",
                location="Somewhere",
                status="Not started",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Terminated",
                last_name="Employee",
                department="No department",
                position="No position",
                location="Nowhere",
                status="Terminated",
                company="Sleek",
            ),
            Employee(
                org_id="org-2",
                first_name="OtherOrg",
                last_name="User",
                department="Other Department",
                position="Other Position",
                location="Other City",
                status="Active",
                company="Other Co",
            ),
        ]
        session.add_all(seed_employees)
        session.commit()
        print(f"Seeded {len(seed_employees)} employees.")


if __name__ == "__main__":
    seed_employees()

