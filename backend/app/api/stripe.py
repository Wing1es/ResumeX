import os
import json
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.api.reviews import get_current_user

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        price_id = os.getenv("STRIPE_PRICE_ID")
        if not price_id:
            raise ValueError("STRIPE_PRICE_ID is not set in environment.")
            
        if not stripe.api_key:
            raise ValueError("STRIPE_SECRET_KEY is not set.")

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"{frontend_url}/billing?success=true",
            cancel_url=f"{frontend_url}/billing?canceled=true",
            client_reference_id=str(current_user.id),
            customer_email=current_user.email
        )
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    event = None

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            event_dict = json.loads(payload)
            event = stripe.Event.construct_from(event_dict, stripe.api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle successful checkout
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        user_id = getattr(session, 'client_reference_id', None)
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.subscription_tier = "pro"
                user.stripe_customer_id = getattr(session, 'customer', None)
                db.commit()

    return {"status": "success"}

@router.get("/subscription-status")
def get_subscription_status(current_user: User = Depends(get_current_user)):
    return {
        "tier": current_user.subscription_tier,
        "usage_count": current_user.usage_count,
        "max_free_uses": 3
    }

@router.post("/cancel-subscription")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.subscription_tier == "free":
        raise HTTPException(status_code=400, detail="You are not on a paid plan.")
        
    # In a real app, you would call stripe.Subscription.modify here to cancel it in Stripe
    # For this hackathon prototype, we simply downgrade the user in our database
    current_user.subscription_tier = "free"
    db.commit()
    return {"status": "success", "message": "Subscription cancelled successfully."}
