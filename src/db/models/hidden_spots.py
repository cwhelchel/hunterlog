import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class HiddenSpot(Base):
    __tablename__ = "hidden_spots"
    id = sa.Column(sa.Integer, primary_key=True)
    activator = sa.Column(sa.String, nullable=False)
    reference = sa.Column(sa.String, nullable=False)
    created_on = sa.Column(sa.DateTime, nullable=False)

    # expires_on calculated when hidden by user. should be next start of the
    # next UTC data after create_on
    expires_on = sa.Column(sa.DateTime, nullable=False)

    enabled = sa.Column(sa.Boolean, default=True)

    def __repr__(self):
        fmt = "<hiddenspot({self.id!r}:{self.activator!r}@{self.reference!r})>"
        return fmt.format(self=self)


class HiddenSpotSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = HiddenSpot
        load_instance = True


Base.metadata.create_all(engine)
