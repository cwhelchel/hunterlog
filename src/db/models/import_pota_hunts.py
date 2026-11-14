import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from fs.glob import database_file

Base = declarative_base()
db_url = sa.URL.create(drivername="sqlite", database=str(database_file))
engine = sa.create_engine(db_url)

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
