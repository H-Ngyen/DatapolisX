# NGSI-LD Public API

NGSI-LD compliant APIs for DatapolisX traffic monitoring system.

## Endpoints

### 1. Query Entities
```
GET /api/ngsi-ld/entities?type={entityType}&id={entityId}&limit={limit}
```

**Supported Entity Types:**
- `TrafficFlowObserved` - Real-time traffic flow observations
- `Device` - Camera/sensor devices
- `TrafficPrediction` - Traffic predictions

**Examples:**
```bash
# Get all traffic flow observations
GET /api/ngsi-ld/entities?type=TrafficFlowObserved&limit=50

# Get traffic flow for specific camera
GET /api/ngsi-ld/entities?type=TrafficFlowObserved&id=urn:ngsi-ld:Camera:CAM001

# Get all cameras
GET /api/ngsi-ld/entities?type=Device

# Get traffic predictions
GET /api/ngsi-ld/entities?type=TrafficPrediction&limit=100
```

### 2. Temporal Queries
```
GET /api/ngsi-ld/temporal?type={entityType}&cameraId={cameraId}&timerel=between&timeAt={startTime}&endTimeAt={endTime}
```

**Examples:**
```bash
# Get traffic flow history for last 24 hours
GET /api/ngsi-ld/temporal?type=TrafficFlowObserved&cameraId=CAM001

# Get traffic flow for specific time range
GET /api/ngsi-ld/temporal?type=TrafficFlowObserved&cameraId=CAM001&timeAt=2025-01-01T00:00:00Z&endTimeAt=2025-01-01T23:59:59Z
```

## NGSI-LD Entity Models

### TrafficFlowObserved
```json
{
  "id": "urn:ngsi-ld:TrafficFlowObserved:CAM001:123",
  "type": "TrafficFlowObserved",
  "dateObserved": {
    "type": "Property",
    "value": { "@type": "DateTime", "@value": "2025-01-15T10:30:00Z" }
  },
  "intensity": {
    "type": "Property",
    "value": 45,
    "observedAt": "2025-01-15T10:30:00Z"
  },
  "vehicleSubType": {
    "type": "Property",
    "value": {
      "motorbike": 20,
      "car": 15,
      "truck": 5,
      "bus": 3,
      "container": 2
    }
  },
  "refRoadSegment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:CAM001"
  }
}
```

### Device (Camera)
```json
{
  "id": "urn:ngsi-ld:Camera:CAM001",
  "type": "Device",
  "category": {
    "type": "Property",
    "value": ["sensor", "camera"]
  },
  "controlledProperty": {
    "type": "Property",
    "value": ["trafficFlow", "vehicleCount"]
  },
  "deviceState": {
    "type": "Property",
    "value": "ok"
  },
  "dateLastValueReported": {
    "type": "Property",
    "value": { "@type": "DateTime", "@value": "2025-01-15T10:30:00Z" }
  }
}
```

### TrafficPrediction
```json
{
  "id": "urn:ngsi-ld:TrafficPrediction:CAM001:456",
  "type": "TrafficPrediction",
  "refRoadSegment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:CAM001"
  },
  "forecastTimestamp": {
    "type": "Property",
    "value": { "@type": "DateTime", "@value": "2025-01-15T11:00:00Z" }
  },
  "predictedIntensity": {
    "type": "Property",
    "value": 52,
    "unitCode": "vehicles"
  },
  "forecastHour": {
    "type": "Property",
    "value": 11
  },
  "isWeekend": {
    "type": "Property",
    "value": false
  }
}
```

## Standards Compliance

This API follows:
- ETSI GS CIM 009 V1.6.1 (NGSI-LD API)
- Smart Data Models (Traffic Flow, Device)
- JSON-LD 1.1

## Usage Notes

- All responses include `Content-Type: application/ld+json`
- Context is provided via Link header
- Temporal queries support ISO 8601 datetime format
- Default limit is 100 entities per request
