#!/usr/bin/env python3
"""
COLLEGRANCE Stripe Product & Price Registration Script
=======================================================

This script reads products.json and creates corresponding Stripe Products
and Prices via the Stripe API. After creation, it updates products.json
with the real Stripe Price IDs.

Usage:
------
  1. Set your Stripe secret key as an environment variable:

       export STRIPE_SECRET_KEY="sk_live_..."

  2. (Optional) Do a dry run first to preview what will be created:

       python3 stripe-setup.py --dry-run

  3. Run for real:

       python3 stripe-setup.py

  4. To force re-creation of all products (ignore existing ones):

       python3 stripe-setup.py --force

Notes:
------
  - The script will install the 'stripe' package automatically if missing.
  - Products that already exist on Stripe (matched by metadata product_id)
    will be skipped unless --force is used.
  - A backup of products.json is saved as products.json.bak before updating.
  - A "Shipping (¥700)" product/price is also created.
  - All prices are in JPY (Japanese Yen), which is a zero-decimal currency,
    so sellPrice values are used directly as unit_amount.

Stripe Account: acct_1SVQAgIYUZm6bpup
"""

import json
import os
import sys
import shutil
import argparse
import time

# ---------------------------------------------------------------------------
# Auto-install stripe if not present
# ---------------------------------------------------------------------------
try:
    import stripe
except ImportError:
    print("[INFO] 'stripe' package not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "stripe"])
    import stripe


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PRODUCTS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products.json")
BACKUP_PATH = PRODUCTS_JSON_PATH + ".bak"
CURRENCY = "jpy"
SHIPPING_PRICE_JPY = 700
STRIPE_ACCOUNT = "acct_1SVQAgIYUZm6bpup"


def load_products(path: str) -> list:
    """Load products from JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_products(path: str, products: list) -> None:
    """Save products to JSON file with pretty formatting."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"[OK] Saved updated products to {path}")


def find_existing_products() -> dict:
    """
    Fetch all existing Stripe products and return a mapping of
    metadata['collegrance_product_id'] -> product object.
    """
    existing = {}
    products = stripe.Product.list(limit=100, active=True)
    for product in products.auto_paging_iter():
        meta_id = product.metadata.get("collegrance_product_id")
        if meta_id:
            existing[meta_id] = product
    return existing


def find_existing_prices(product_id: str) -> list:
    """Fetch active prices for a given Stripe product."""
    prices = stripe.Price.list(product=product_id, active=True, limit=10)
    return list(prices.data)


def create_stripe_product(product: dict, dry_run: bool = False) -> tuple:
    """
    Create a Stripe Product and Price for a given product dict.
    Returns (stripe_product, stripe_price) or (None, None) on dry run.
    """
    product_name = f"{product['brand']} - {product['name']}"
    if product.get("nameJa"):
        product_name += f" ({product['nameJa']})"

    description_parts = []
    if product.get("brand"):
        description_parts.append(f"Brand: {product['brand']}")
    if product.get("notes"):
        description_parts.append(f"Notes: {product['notes']}")
    if product.get("size"):
        description_parts.append(f"Size: {product['size']}")
    description = " | ".join(description_parts)

    metadata = {
        "collegrance_product_id": str(product["id"]),
        "brand": product.get("brand", ""),
        "size": product.get("size", ""),
    }

    images = []
    if product.get("img"):
        # Only include if it looks like a full URL; local paths won't work on Stripe
        img = product["img"]
        if img.startswith("http"):
            images.append(img)

    sell_price = product["sellPrice"]

    if dry_run:
        print(f"  [DRY-RUN] Would create product: {product_name}")
        print(f"            Description: {description}")
        print(f"            Price: ¥{sell_price:,}")
        print(f"            Metadata: {metadata}")
        return None, None

    # Create the product
    stripe_product = stripe.Product.create(
        name=product_name,
        description=description,
        metadata=metadata,
        images=images if images else stripe.api_resources.abstract.api_resource.UNSET if hasattr(stripe, 'api_resources') else [],
    )
    print(f"  [OK] Created product: {stripe_product.id} - {product_name}")

    # Create the price
    stripe_price = stripe.Price.create(
        product=stripe_product.id,
        unit_amount=sell_price,  # JPY is zero-decimal
        currency=CURRENCY,
        metadata={
            "collegrance_product_id": str(product["id"]),
        },
    )
    print(f"  [OK] Created price:   {stripe_price.id} -> ¥{sell_price:,}")

    return stripe_product, stripe_price


def create_shipping_product(dry_run: bool = False) -> str | None:
    """
    Create a 'Shipping' product with a ¥700 price.
    Returns the Stripe Price ID, or None on dry run.
    """
    if dry_run:
        print(f"  [DRY-RUN] Would create Shipping product with price ¥{SHIPPING_PRICE_JPY:,}")
        return None

    # Check if shipping product already exists
    products = stripe.Product.list(limit=100, active=True)
    for p in products.auto_paging_iter():
        if p.metadata.get("collegrance_type") == "shipping":
            # Check for existing price
            prices = find_existing_prices(p.id)
            for price in prices:
                if price.unit_amount == SHIPPING_PRICE_JPY and price.currency == CURRENCY:
                    print(f"  [SKIP] Shipping product already exists: {p.id}, price: {price.id}")
                    return price.id

    shipping_product = stripe.Product.create(
        name="Shipping (配送料)",
        description="Standard shipping fee / 通常配送料",
        metadata={
            "collegrance_type": "shipping",
        },
    )
    print(f"  [OK] Created shipping product: {shipping_product.id}")

    shipping_price = stripe.Price.create(
        product=shipping_product.id,
        unit_amount=SHIPPING_PRICE_JPY,
        currency=CURRENCY,
        metadata={
            "collegrance_type": "shipping",
        },
    )
    print(f"  [OK] Created shipping price:   {shipping_price.id} -> ¥{SHIPPING_PRICE_JPY:,}")

    return shipping_price.id


def main():
    parser = argparse.ArgumentParser(
        description="Register COLLEGRANCE products on Stripe and update products.json"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be created without making any API calls",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-create products even if they already exist on Stripe",
    )
    args = parser.parse_args()

    # -----------------------------------------------------------------------
    # Validate API key
    # -----------------------------------------------------------------------
    api_key = os.environ.get("STRIPE_SECRET_KEY")
    if not api_key:
        print("[ERROR] STRIPE_SECRET_KEY environment variable is not set.")
        print("        Run: export STRIPE_SECRET_KEY='sk_live_...'")
        sys.exit(1)

    if not api_key.startswith("sk_"):
        print("[ERROR] STRIPE_SECRET_KEY does not look like a valid Stripe secret key.")
        print("        It should start with 'sk_live_' or 'sk_test_'.")
        sys.exit(1)

    stripe.api_key = api_key

    if args.dry_run:
        print("=" * 60)
        print("  DRY RUN MODE - No changes will be made")
        print("=" * 60)
    else:
        # Quick connectivity check
        try:
            stripe.Account.retrieve()
            print("[OK] Stripe API connection verified.")
        except stripe.error.AuthenticationError:
            print("[ERROR] Invalid Stripe API key. Check your STRIPE_SECRET_KEY.")
            sys.exit(1)
        except Exception as e:
            print(f"[ERROR] Could not connect to Stripe: {e}")
            sys.exit(1)

    # -----------------------------------------------------------------------
    # Load products
    # -----------------------------------------------------------------------
    print(f"\n[INFO] Loading products from {PRODUCTS_JSON_PATH}")
    products = load_products(PRODUCTS_JSON_PATH)
    print(f"[INFO] Found {len(products)} products.")

    # -----------------------------------------------------------------------
    # Check for existing Stripe products (to avoid duplicates)
    # -----------------------------------------------------------------------
    existing_map = {}
    if not args.dry_run and not args.force:
        print("\n[INFO] Checking for existing products on Stripe...")
        existing_map = find_existing_products()
        if existing_map:
            print(f"[INFO] Found {len(existing_map)} existing COLLEGRANCE products on Stripe.")

    # -----------------------------------------------------------------------
    # Create products and prices
    # -----------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Creating Products & Prices")
    print("=" * 60)

    price_id_map = {}  # product_id -> stripe_price_id
    created_count = 0
    skipped_count = 0
    error_count = 0

    for i, product in enumerate(products, 1):
        pid = str(product["id"])
        product_label = f"[{i}/{len(products)}] ID={pid} {product['brand']} - {product['name']}"
        print(f"\n{product_label}")

        # Skip if already exists
        if pid in existing_map and not args.force and not args.dry_run:
            existing_product = existing_map[pid]
            prices = find_existing_prices(existing_product.id)
            if prices:
                price_id_map[pid] = prices[0].id
                print(f"  [SKIP] Already exists. Price ID: {prices[0].id}")
                skipped_count += 1
                continue

        try:
            stripe_product, stripe_price = create_stripe_product(product, dry_run=args.dry_run)
            if stripe_price:
                price_id_map[pid] = stripe_price.id
            created_count += 1
        except stripe.error.StripeError as e:
            print(f"  [ERROR] Stripe error: {e.user_message or str(e)}")
            error_count += 1
        except Exception as e:
            print(f"  [ERROR] Unexpected error: {e}")
            error_count += 1

        # Small delay to avoid rate limiting
        if not args.dry_run and i % 10 == 0:
            time.sleep(0.5)

    # -----------------------------------------------------------------------
    # Create Shipping product
    # -----------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Creating Shipping Product")
    print("=" * 60)

    try:
        shipping_price_id = create_shipping_product(dry_run=args.dry_run)
        if shipping_price_id:
            price_id_map["shipping"] = shipping_price_id
    except stripe.error.StripeError as e:
        print(f"  [ERROR] Stripe error creating shipping: {e.user_message or str(e)}")
        error_count += 1
    except Exception as e:
        print(f"  [ERROR] Unexpected error creating shipping: {e}")
        error_count += 1

    # -----------------------------------------------------------------------
    # Update products.json
    # -----------------------------------------------------------------------
    if not args.dry_run and price_id_map:
        print("\n" + "=" * 60)
        print("  Updating products.json")
        print("=" * 60)

        # Backup first
        shutil.copy2(PRODUCTS_JSON_PATH, BACKUP_PATH)
        print(f"[OK] Backup saved to {BACKUP_PATH}")

        for product in products:
            pid = str(product["id"])
            if pid in price_id_map:
                product["stripePriceId"] = price_id_map[pid]

        save_products(PRODUCTS_JSON_PATH, products)

        # Also save the shipping price ID to a separate mapping file for reference
        mapping = {
            "products": price_id_map,
            "shipping_price_id": price_id_map.get("shipping", ""),
        }
        mapping_path = os.path.join(os.path.dirname(PRODUCTS_JSON_PATH), "stripe-price-mapping.json")
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
        print(f"[OK] Price ID mapping saved to {mapping_path}")

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"  Total products:  {len(products)}")
    print(f"  Created:         {created_count}")
    print(f"  Skipped:         {skipped_count}")
    print(f"  Errors:          {error_count}")
    if price_id_map.get("shipping"):
        print(f"  Shipping Price:  {price_id_map['shipping']}")
    print()

    if args.dry_run:
        print("[INFO] This was a dry run. No changes were made.")
        print("[INFO] Run without --dry-run to create products for real.")

    if error_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
