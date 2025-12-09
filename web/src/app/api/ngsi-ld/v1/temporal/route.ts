/**
 * NGSI-LD Temporal API
 * GET /api/ngsi-ld/temporal - Query temporal evolution of entities
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errorHandler'
import prisma from '@/lib/prisma'
import { DetectionData } from '@/lib/types'

const BASE_URI = "urn:ngsi-ld:";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const type = req.nextUrl.searchParams.get('type');
  const cameraId = req.nextUrl.searchParams.get('cameraId');
  const timerel = req.nextUrl.searchParams.get('timerel') || 'between';
  const timeAt = req.nextUrl.searchParams.get('timeAt');
  const endTimeAt = req.nextUrl.searchParams.get('endTimeAt');

  if (!type || !cameraId) {
    return NextResponse.json({ 
      type: "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
      title: "Missing required parameters: type, cameraId" 
    }, { status: 400 });
  }

  if (type !== 'TrafficFlowObserved') {
    return NextResponse.json({ 
      type: "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
      title: "Only TrafficFlowObserved supports temporal queries" 
    }, { status: 400 });
  }

  const startDate = timeAt ? new Date(timeAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endDate = endTimeAt ? new Date(endTimeAt) : new Date();

  const detections = await prisma.camera_detections.findMany({
    where: {
      camera_id: cameraId,
      created_at: { gte: startDate, lte: endDate }
    },
    orderBy: { created_at: 'asc' }
  });

  const temporalEntity = {
    id: `${BASE_URI}TrafficFlowObserved:${cameraId}`,
    type: "TrafficFlowObserved",
    intensity: detections.map(d => ({
      type: "Property",
      value: d.total_objects,
      observedAt: d.created_at.toISOString()
    })),
    vehicleSubType: detections.map(d => {
      const det = d.detections as DetectionData;
      return {
        type: "Property",
        value: {
          motorbike: det?.motorbike || 0,
          car: det?.car || 0,
          truck: det?.truck || 0,
          bus: det?.bus || 0,
          container: det?.container || 0
        },
        observedAt: d.created_at.toISOString()
      };
    }),
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"]
  };

  return NextResponse.json(temporalEntity, {
    headers: {
      'Content-Type': 'application/ld+json'
    }
  });
});
