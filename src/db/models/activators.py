import json
import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow.decorators import pre_load, post_load

Base = declarative_base()
engine = sa.create_engine("sqlite:///spots.db")


class Activator(Base):
    __tablename__ = "activators"
    activator_id = sa.Column(sa.Integer, primary_key=True)
    callsign = sa.Column(sa.String)
    name = sa.Column(sa.String)
    qth = sa.Column(sa.String)
    gravatar = sa.Column(sa.String)
    activator = sa.Column(sa.JSON)
    attempts = sa.Column(sa.JSON)
    hunter = sa.Column(sa.JSON)
    endorsements = sa.Column(sa.Integer)
    awards = sa.Column(sa.Integer)

    def __repr__(self):
        return "<activator(id={self.activator_id!r})>".format(self=self)


class ActivatorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Activator
        load_instance = True
    
    # @pre_load
    # def deserialize_pickle_bin(self, data, **kwargs):
    #     # For some reason, marshmallow serializes the dict to a string.
    #     # So this is nesessary.
    #     print(f"preload: {data}")
    #     # data["activator"] = json.loads(data["activator"].replace("'", "\""))
    #     # data["attempts"] = json.loads(data["attempts"].replace("'", "\""))
    #     # data["hunter"] = json.loads(data["hunter"].replace("'", "\""))
    #     return data
    
    # @post_load
    # def post_load(self, data, **kwargs):
    #     # For some reason, marshmallow serializes the dict to a string.
    #     # So this is nesessary.
    #     print(f"postload: {data}")
    #     # data["activator"] = json.loads(data["activator"].replace("'", "\""))
    #     # data["attempts"] = json.loads(data["attempts"].replace("'", "\""))
    #     # data["hunter"] = json.loads(data["hunter"].replace("'", "\""))
    #     return data    


Base.metadata.create_all(engine)
