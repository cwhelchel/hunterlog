import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class ConfigVer2(Base):
    __tablename__ = "config_ver2"
    id = sa.Column(sa.Integer, primary_key=True)
    key = sa.Column(sa.String(200), nullable=False)
    val = sa.Column(sa.String, nullable=False)
    type = sa.Column(sa.String(50), nullable=False)
    enabled = sa.Column(sa.Boolean, default=True)
    editable = sa.Column(sa.Boolean, default=True)
    description = sa.Column(sa.String(200), nullable=True)
    group = sa.Column(sa.String(50), nullable=True)

    def __repr__(self):
        return "<config({self.key!r}:{self.val!r})>" \
            .format(self=self)


class ConfigVer2Schema(SQLAlchemyAutoSchema):
    class Meta:
        model = ConfigVer2
        load_instance = True


Base.metadata.create_all(engine)
