import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class ImportPotaHunt(Base):
    '''
    This is for the table where the hunter_parks.csv file from pota.app will be
    loaded before the hunts in Parks table are updated.
    '''
    __tablename__ = "import_pota_hunts"
    id = sa.Column(sa.String(50), primary_key=True)
    hunts = sa.Column(sa.Integer, default=0)

    def __repr__(self):
        return "<park({self.id!r}:hunts{self.hunts!r})>" \
            .format(self=self)


class ImportPotaHuntSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ImportPotaHunt
        load_instance = True


Base.metadata.create_all(engine)
