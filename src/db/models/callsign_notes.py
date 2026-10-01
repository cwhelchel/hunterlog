from datetime import timezone
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class CallsignNote(Base):
    __tablename__ = "callsign_notes"
    id = sa.Column(sa.Integer, primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    path = sa.Column(sa.String, nullable=False)
    order = sa.Column(sa.Integer)
    last_download = sa.Column(sa.DateTime(timezone=True), nullable=True)
    enabled = sa.Column(sa.Boolean, default=True)

    def __repr__(self):
        fmt = "<call_note({self.id!r}:{self.name!r})>"
        return fmt.format(self=self)

    @property
    def last_download_tz(self):
        return self.last_download.replace(tzinfo=timezone.utc)


class CallsignNoteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = CallsignNote
        load_instance = True


Base.metadata.create_all(engine)
