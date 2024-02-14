import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class UserConfig(Base):
    __tablename__ = "config"
    id = sa.Column(sa.Integer, primary_key=True)
    my_call = sa.Column(sa.String)
    my_grid6 = sa.Column(sa.String(6))
    default_pwr = sa.Column(sa.Integer)

    def __repr__(self):
        return "<config({self.my_call!r}:{self.my_grid6!r})>" \
            .format(self=self)


class UserConfigSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = UserConfig
        load_instance = True


Base.metadata.create_all(engine)