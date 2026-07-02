"""Pydantic schemas — the contracts between the AI and the rest of the engine.

These double as structured-output schemas for the Claude API, so every AI
step returns validated, typed data instead of free text.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ProductIdea(BaseModel):
    name: str = Field(description="Short, brandable product name")
    category: str = Field(description="Product category, e.g. 'home fitness'")
    why_winning: str = Field(description="Evidence this product is trending right now, citing what was found in research")
    target_audience: str = Field(description="Who buys this and why")
    estimated_supplier_cost_usd: float = Field(description="Realistic per-unit sourcing cost from AliExpress/CJ-style suppliers")
    suggested_retail_usd: float = Field(description="Recommended retail price")
    sourcing_keywords: List[str] = Field(description="Search terms to find this exact product on supplier marketplaces")
    risk_notes: str = Field(description="Saturation, seasonality, shipping or IP risks")


class ResearchReport(BaseModel):
    niche: str
    market_summary: str = Field(description="2-3 paragraph summary of the current market and trends found")
    products: List[ProductIdea]


class ListingVariantOption(BaseModel):
    name: str = Field(description="Option name, e.g. 'Color'")
    values: List[str] = Field(description="Option values, e.g. ['Black', 'Sand']")


class Listing(BaseModel):
    title: str = Field(description="SEO product title, under 70 chars")
    description_html: str = Field(description="Rich HTML product description: hook, benefits as bullets, specs, guarantee")
    seo_meta_description: str = Field(description="Meta description under 160 chars")
    tags: List[str] = Field(description="Shopify tags for search and collections")
    product_type: str
    price_usd: float
    compare_at_price_usd: Optional[float] = Field(default=None, description="Anchor 'was' price, ~30-40% above price")
    options: List[ListingVariantOption] = Field(default_factory=list)


class AdCreative(BaseModel):
    platform: str = Field(description="'facebook', 'instagram', 'tiktok' or 'google'")
    headline: str
    primary_text: str
    call_to_action: str
    angle: str = Field(description="The psychological angle: pain point, social proof, novelty, etc.")


class EmailCampaign(BaseModel):
    subject: str
    preview_text: str
    body_html: str


class MarketingKit(BaseModel):
    product_name: str
    ads: List[AdCreative] = Field(description="At least 4 creatives across platforms and angles")
    welcome_email: EmailCampaign
    abandoned_cart_email: EmailCampaign
    launch_announcement: str = Field(description="Short launch blurb usable anywhere")


class SocialPost(BaseModel):
    platform: str = Field(description="'facebook', 'instagram' or 'x'")
    text: str = Field(description="Post copy, within the platform's length limits, hashtags included")
    image_prompt: str = Field(description="A prompt describing the ideal image/video for this post")
    best_time_utc: str = Field(description="Suggested posting time as HH:MM UTC")
    goal: str = Field(description="What this post is for: awareness, engagement, conversion")


class SocialCalendar(BaseModel):
    theme: str = Field(description="The content theme tying this batch together")
    posts: List[SocialPost]


class TikTokScene(BaseModel):
    seconds: float = Field(description="Scene duration in seconds")
    visual: str = Field(description="What is on screen: shot description or which asset to show")
    on_screen_text: str = Field(description="Text overlay for this scene, short and punchy ('' if none)")
    voiceover: str = Field(description="Spoken/voiceover line for this scene ('' if none)")


class TikTokVideoPlan(BaseModel):
    concept: str = Field(description="One-line description of the video")
    trend_basis: str = Field(description="The specific current trend/sound/format this rides, from research")
    hook: str = Field(description="First 1-2 seconds: the line or visual that stops the scroll")
    scenes: List[TikTokScene] = Field(description="Scene-by-scene storyboard, 15-35s total")
    caption: str = Field(description="Post caption, no hashtags")
    hashtags: List[str] = Field(description="3-6 hashtags mixing trending and niche")
    sound_suggestion: str = Field(description="Trending sound/audio to use, named specifically")
    goal: str = Field(description="awareness, engagement or conversion")


class TikTokBatch(BaseModel):
    trend_summary: str = Field(description="What is trending on TikTok in this niche right now")
    videos: List[TikTokVideoPlan]
