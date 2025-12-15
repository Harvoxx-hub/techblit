#!/bin/bash
# Script to remove XAI_API_KEY from Cloud Run environment variables

echo "Removing XAI_API_KEY from Cloud Run services..."
echo ""

SERVICES=(
  "api"
  "scheduledgrokfetchbreaking"
  "scheduledgrokfetchtrending"
  "scheduledgrokfetchfunding"
  "scheduledgrokfetchcompany"
)

for service in "${SERVICES[@]}"; do
  echo "Removing XAI_API_KEY from $service..."
  gcloud run services update "$service" \
    --region=us-central1 \
    --remove-env-vars XAI_API_KEY \
    --quiet 2>&1 | grep -v "ERROR" || echo "  ✓ Done (or already removed)"
done

echo ""
echo "✅ Complete! Now deploy: firebase deploy --only functions"
