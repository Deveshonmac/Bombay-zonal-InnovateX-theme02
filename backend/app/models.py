import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Cluster(Base):
    """
    Represents a cluster of similar/nearby complaints grouped together
    to collapse 40 duplicate reports into 1 actionable incident.
    """
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    radius_meters = Column(Float, default=500.0)
    complaint_count = Column(Integer, default=1)
    priority_score = Column(Float, default=0.0, index=True)
    status = Column(String(50), default="open", index=True)  # open, in_review, actioned, resolved
    recommendation = Column(Text, nullable=True)  # AI-generated recommendation
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="cluster")
    actions = relationship("Action", back_populates="cluster")


class Complaint(Base):
    """
    Individual citizen pollution report (ingested via mobile, web, or synthetic data).
    """
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(100), unique=True, index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    reported_aqi = Column(Float, nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, clustered, resolved
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Link to the cluster this complaint belongs to (once clustered)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    cluster = relationship("Cluster", back_populates="complaints")


class Action(Base):
    """
    Resolution and outcome tracking: logs the intervention applied by the nodal officer
    and captures before/after AQI to measure real-world impact.
    """
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    action_taken = Column(String(255), nullable=False)
    officer_notes = Column(Text, nullable=True)
    aqi_before = Column(Float, nullable=False)
    aqi_after = Column(Float, nullable=True)
    resolved_at = Column(DateTime, default=datetime.datetime.utcnow)

    cluster = relationship("Cluster", back_populates="actions")
