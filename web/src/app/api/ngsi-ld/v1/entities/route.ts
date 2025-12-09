/**
 * NGSI-LD Entities API
 * GET /api/ngsi-ld/entities - Query entities
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errorHandler'
import ngsiLdController from '@/controllers/ngsiLdController'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const type = req.nextUrl.searchParams.get('type');
  const id = req.nextUrl.searchParams.get('id');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

  let entities: any[] = [];

  if (!type) {
    return NextResponse.json({ 
      type: "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
      title: "Missing required parameter: type" 
    }, { status: 400 });
  }

  const cameraId = id?.replace('urn:ngsi-ld:Camera:', '');

  switch (type) {
    case 'TrafficFlowObserved':
      entities = await ngsiLdController.getTrafficFlowObserved(cameraId, limit);
      break;
    case 'Device':
      entities = await ngsiLdController.getCameras(cameraId);
      break;
    case 'TrafficPrediction':
      entities = await ngsiLdController.getTrafficPredictions(cameraId, limit);
      break;
    default:
      return NextResponse.json({ 
        type: "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
        title: `Unsupported entity type: ${type}` 
      }, { status: 400 });
  }

  return NextResponse.json(entities, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
    }
  });
});
