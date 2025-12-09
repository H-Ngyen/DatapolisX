/**
 * NGSI-LD Controller for DatapolisX
 * Provides standardized NGSI-LD entities for traffic monitoring
 */

import prisma from '@/lib/prisma'
import { DetectionData } from '@/lib/types';

const NGSI_LD_CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld";
const BASE_URI = "urn:ngsi-ld:";

// Get TrafficFlowObserved entities
async function getTrafficFlowObserved(cameraId?: string, limit: number = 100) {
  const where = cameraId ? { camera_id: cameraId } : {};
  
  const detections = await prisma.camera_detections.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return detections.map(d => {
    const det = d.detections as DetectionData;
    return {
      id: `${BASE_URI}TrafficFlowObserved:${d.camera_id}:${d.id}`,
      type: "TrafficFlowObserved",
      dateObserved: {
        type: "Property",
        value: { "@type": "DateTime", "@value": d.created_at.toISOString() }
      },
      location: {
        type: "GeoProperty",
        value: { type: "Point", coordinates: [0, 0] } // TODO: Add real coordinates
      },
      refRoadSegment: {
        type: "Relationship",
        object: `${BASE_URI}Camera:${d.camera_id}`
      },
      intensity: {
        type: "Property",
        value: d.total_objects,
        observedAt: d.created_at.toISOString()
      },
      vehicleType: {
        type: "Property",
        value: "all"
      },
      vehicleSubType: {
        type: "Property",
        value: {
          motorbike: det?.motorbike || 0,
          car: det?.car || 0,
          truck: det?.truck || 0,
          bus: det?.bus || 0,
          container: det?.container || 0
        }
      },
      "@context": [NGSI_LD_CONTEXT]
    };
  });
}

// Get Camera entities
async function getCameras(cameraId?: string) {
  const where = cameraId ? { camera_id: cameraId } : {};
  
  const cameras = await prisma.camera_detections.groupBy({
    by: ['camera_id'],
    where,
    _count: { camera_id: true },
    _max: { created_at: true }
  });

  return cameras.map(c => ({
    id: `${BASE_URI}Camera:${c.camera_id}`,
    type: "Device",
    category: {
      type: "Property",
      value: ["sensor", "camera"]
    },
    controlledProperty: {
      type: "Property",
      value: ["trafficFlow", "vehicleCount"]
    },
    supportedProtocol: {
      type: "Property",
      value: ["http"]
    },
    deviceState: {
      type: "Property",
      value: "ok"
    },
    dateLastValueReported: {
      type: "Property",
      value: { "@type": "DateTime", "@value": c._max.created_at?.toISOString() }
    },
    location: {
      type: "GeoProperty",
      value: { type: "Point", coordinates: [0, 0] } // TODO: Add real coordinates
    },
    "@context": [NGSI_LD_CONTEXT]
  }));
}

// Get TrafficPrediction entities
async function getTrafficPredictions(cameraId?: string, limit: number = 100) {
  const where = cameraId ? { camera_id: cameraId } : {};
  
  const predictions = await prisma.camera_predictions.findMany({
    where: {
      ...where,
      forecast_timestamp: { gte: new Date() }
    },
    orderBy: { forecast_timestamp: 'asc' },
    take: limit,
  });

  return predictions.map(p => ({
    id: `${BASE_URI}TrafficPrediction:${p.camera_id}:${p.id}`,
    type: "TrafficPrediction",
    refRoadSegment: {
      type: "Relationship",
      object: `${BASE_URI}Camera:${p.camera_id}`
    },
    forecastTimestamp: {
      type: "Property",
      value: { "@type": "DateTime", "@value": p.forecast_timestamp.toISOString() }
    },
    predictedIntensity: {
      type: "Property",
      value: Math.round(p.predicted_total_objects),
      unitCode: "vehicles"
    },
    predictionTime: {
      type: "Property",
      value: { "@type": "DateTime", "@value": p.prediction_time?.toISOString() }
    },
    forecastHour: {
      type: "Property",
      value: p.forecast_hour
    },
    forecastDayOfWeek: {
      type: "Property",
      value: p.forecast_dayofweek
    },
    isWeekend: {
      type: "Property",
      value: p.forecast_is_weekend
    },
    "@context": [NGSI_LD_CONTEXT]
  }));
}

export default {
  getTrafficFlowObserved,
  getCameras,
  getTrafficPredictions,
};
