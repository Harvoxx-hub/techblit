#!/bin/bash
# Remove XAI_API_KEY from Cloud Run env vars (keep only as secret)

echo "Fixing XAI_API_KEY conflict..."

# Try using Firebase to access gcloud
if command -v gcloud &> /dev/null; then
    echo "Using gcloud to remove env vars..."
    gcloud run services update api --region=us-central1 --remove-env-vars XAI_API_KEY --quiet
    gcloud run services update scheduledgrokfetchbreaking --region=us-central1 --remove-env-vars XAI_API_KEY --quiet
    gcloud run services update scheduledgrokfetchtrending --region=us-central1 --remove-env-vars XAI_API_KEY --quiet
    gcloud run services update scheduledgrokfetchfunding --region=us-central1 --remove-env-vars XAI_API_KEY --quiet
    gcloud run services update scheduledgrokfetchcompany --region=us-central1 --remove-env-vars XAI_API_KEY --quiet
    echo "✅ Removed XAI_API_KEY from all services"
else
    echo "❌ gcloud not found. Install it or use Google Cloud Console:"
    echo "   https://console.cloud.google.com/run?project=techblit"
    echo ""
    echo "For each service, go to Edit → Variables & Secrets → Remove XAI_API_KEY from Environment Variables"
fi
