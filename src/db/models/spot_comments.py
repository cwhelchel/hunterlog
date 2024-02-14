import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema


Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class SpotComment(Base):
    __tablename__ = "comments"
    spotId = sa.Column(sa.Integer, primary_key=True)
    spotTime = sa.Column(sa.DateTime)
    spotter = sa.Column(sa.String)
    mode = sa.Column(sa.String(15))
    frequency = sa.Column(sa.String)
    band = sa.Column(sa.String(15))
    source = sa.Column(sa.String(10))
    comments = sa.Column(sa.String)

    activator = sa.Column(sa.String, nullable=True)
    park = sa.Column(sa.String, nullable=True)

    def __repr__(self):
        return "<comment({self.spotId!r}:{self.comments!r})>".format(self=self)


class SpotCommentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SpotComment
        load_instance = True


Base.metadata.create_all(engine)
