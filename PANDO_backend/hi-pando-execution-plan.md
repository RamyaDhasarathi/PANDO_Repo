# Hi Pando — AI Property Recommendation Engine
## 4-Phase AI/ML Execution Plan

### Objective

Build a property recommendation engine for Hi Pando that can recommend relevant real-estate properties based on a user's preferences, conversation history, and behavior.

Since there is currently no historical user or property data, the recommendation system will initially use a cold-start/content-based approach and progressively evolve into an ML-powered recommendation system as interaction data is collected.

---

## Phase 1 — Data Foundation & Property Intelligence

### Goal

Create the data foundation required for the recommendation engine.

At this stage, there is no requirement for historical user behavior data.

### 1.1 Property Dataset

Create a structured property dataset and store it in MongoDB.

**Core Property Attributes**

- Property ID
- Property name
- Developer
- Property type
- Location
- Community
- Latitude / Longitude
- Price
- Bedrooms
- Bathrooms
- Built-up area
- Furnishing status
- Completion status
- Handover date
- Amenities
- Parking
- View
- Floor
- Rental estimate
- Rental yield
- Service charges
- Property purpose
  - End use
  - Investment
  - Rental
- Nearby facilities
  - Metro
  - Schools
  - Hospitals
  - Shopping
  - Beaches
  - Business districts

### 1.2 Data Cleaning

Implement preprocessing for:

- Missing values
- Duplicate properties
- Inconsistent property types
- Inconsistent location names
- Currency/price normalization
- Area unit normalization
- Amenity normalization
- Text cleaning

### 1.3 Property Feature Engineering

Convert raw property information into machine-readable features.

Examples:

```text
Price → normalized price
Bedrooms → numerical feature
Property Type → encoded feature
Location → encoded/geographical feature
Amenities → multi-hot encoded features
Rental Yield → numerical feature
Distance to Metro → numerical feature
```

### 1.4 Initial Dataset

If real property data is unavailable:

- Create a synthetic property dataset
- Generate realistic Dubai property records
- Ensure sufficient variation across:
  - Locations
  - Prices
  - Property types
  - Bedrooms
  - Amenities
  - Investment characteristics

### Deliverables

- Property MongoDB collection
- Property data validation pipeline
- Clean property dataset
- Property feature schema
- Initial feature-engineering pipeline

---

## Phase 2 — User DNA & Cold-Start Recommendation Engine

### Goal

Build the first working recommendation engine without requiring historical user data.

The AI agent will convert the user's conversation into a structured preference profile.

### 2.1 User DNA

Create a structured user preference object.

Example:

```json
{
  "budget": {
    "min": 1000000,
    "max": 1800000
  },
  "locations": [
    "Dubai Marina",
    "JVC"
  ],
  "propertyTypes": [
    "Apartment"
  ],
  "bedrooms": 2,
  "purpose": "Investment",
  "amenities": [
    "Gym",
    "Pool"
  ],
  "transportPreference": "Near Metro",
  "rentalYieldPreference": "High"
}
```

### 2.2 Preference Extraction

The AI conversation agent extracts relevant preferences from the conversation.

Example:

```
User:
"I want a 2-bedroom apartment around 1.5 million in Dubai,
preferably somewhere close to the metro."

                ↓

User DNA

Budget = 1.5M
Property Type = Apartment
Bedrooms = 2
Location = Dubai
Transport = Metro
```

The recommendation engine should receive structured data rather than raw conversation.

### 2.3 Feature Matching

Compare User DNA against property features.

Calculate individual matching scores:

- Budget Match
- Location Match
- Property Type Match
- Bedroom Match
- Purpose Match
- Amenity Match
- Area Match
- Transport Match
- Investment Match

Each score should be normalized between:

- 0 → No Match
- 1 → Perfect Match

### 2.4 Initial Recommendation Score

Implement a weighted scoring algorithm.

Example:

```
Recommendation Score =

30% Budget Match
20% Location Match
15% Property Type Match
10% Bedroom Match
10% Purpose Match
5%  Amenities Match
5%  Area Match
5%  Investment / Rental Match
```

The weights should be configurable rather than hard-coded throughout the application.

### 2.5 Candidate Generation

Instead of scoring every property blindly:

```
All Properties
      ↓
Basic Filters
      ↓
Candidate Properties
      ↓
Feature Matching
      ↓
Scoring
      ↓
Ranking
      ↓
Top N Properties
```

Example:

```
10,000 properties
       ↓
2,000 match basic budget/location requirements
       ↓
500 suitable candidates
       ↓
Score all 500
       ↓
Top 10 recommendations
```

### 2.6 Recommendation Explanation

Every recommendation should have an explanation.

Example:

```
Recommended because:

✓ Within your budget
✓ 2-bedroom apartment
✓ Located near Dubai Marina
✓ Close to metro
✓ Suitable for investment
✓ High rental potential
```

This is important for Hi Pando because the recommendation should feel like an advisor rather than a search filter.

### Deliverables

- User DNA schema
- Preference extraction pipeline
- Feature matching engine
- Configurable recommendation scoring engine
- Candidate generation pipeline
- Property ranking system
- Recommendation explanation system
- API endpoint for recommendations

---

## Phase 3 — Behavioral Data & ML Recommendation Model

### Goal

Turn the initial recommendation engine into a data-driven ML recommendation system.

The system now starts learning from actual user behavior.

### 3.1 Interaction Tracking

Track how users interact with recommendations.

Events:

- PROPERTY_SHOWN
- PROPERTY_CLICKED
- PROPERTY_VIEWED
- PROPERTY_SAVED
- PROPERTY_SHORTLISTED
- PROPERTY_REJECTED
- BROKER_CONTACTED
- VIEWING_REQUESTED

Store every interaction.

Example:

```json
{
  "userId": "U123",
  "propertyId": "P456",
  "event": "PROPERTY_SAVED",
  "timestamp": "...",
  "recommendationScore": 0.87
}
```

### 3.2 Build Training Dataset

Convert interaction history into ML training data.

```
User Features
+
Property Features
+
Interaction Context
+
Historical Outcome
```

Example:

```
User Budget = 1.5M
User Bedrooms = 2
Property Price = 1.45M
Property Bedrooms = 2
Location Match = 1
Metro Distance = 500m
Rental Yield = 7.2%

User Action = SAVED

Training Label = Positive
```

### 3.3 Feature Engineering

Create features such as:

**User Features**

- Budget range
- Preferred locations
- Preferred property type
- Preferred bedrooms
- Investment/end-use preference
- Preferred amenities
- Previous interactions
- Average property price viewed
- Average property size viewed

**Property Features**

- Price
- Bedrooms
- Property type
- Location
- Rental yield
- Area
- Amenities
- Developer
- Distance to metro
- Completion status

**User × Property Features**

These are particularly important.

- Price Difference
- Budget Compatibility
- Location Similarity
- Bedroom Difference
- Amenity Similarity
- Property Type Match
- Historical User Interest
- Distance Preference
- Investment Compatibility

### 3.4 ML Ranking Model

Train an initial supervised learning model.

Recommended starting point: **XGBoost / LightGBM**

The model predicts the probability that a user will positively interact with a property.

```
User + Property
       ↓
Feature Engineering
       ↓
ML Ranking Model
       ↓
Probability / Score
       ↓
Property Ranking
```

Start with a simple model and establish a baseline before experimenting with more complex approaches.

### 3.5 Model Evaluation

Evaluate the recommender using metrics appropriate for ranking.

Primary metrics:

- Precision@K
- Recall@K
- NDCG@K
- MAP@K
- CTR
- Save Rate
- Shortlist Rate
- Viewing Request Rate

Example:

```
Top 10 recommendations

6 properties relevant
4 properties irrelevant

Precision@10 = 60%
```

### 3.6 A/B Testing

Compare:

- **Version A** — Rule-Based Recommendation
- **Version B** — ML-Based Recommendation

Measure:

- Click-through rate
- Property saves
- Shortlists
- Broker contacts
- Viewing requests

### Deliverables

- Interaction/event tracking
- Recommendation feedback dataset
- Training dataset pipeline
- Feature engineering pipeline
- ML ranking model
- Model evaluation pipeline
- Recommendation API integration
- Experiment/A-B testing framework

---

## Phase 4 — Hybrid Recommendation & Continuous Learning

### Goal

Build a production-grade recommendation system that combines user preferences, property similarity, behavioral learning, and semantic understanding.

### 4.1 Hybrid Recommendation Architecture

Combine multiple recommendation signals.

```
                    User
                     │
                     ▼
                User DNA
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
 Content-Based             Behavioral Model
 Matching                  ML Ranking
          │                     │
          └──────────┬──────────┘
                     ▼
              Hybrid Scoring
                     │
                     ▼
             Candidate Ranking
                     │
                     ▼
              Top N Properties
```

### 4.2 Hybrid Score

Example:

```
Final Score =

40% ML Ranking Score
25% User Preference Match
15% Property Similarity
10% Behavioral Similarity
10% Business / Context Score
```

The exact weights should be determined through experimentation rather than assumed to be optimal.

### 4.3 Semantic Property Matching

Introduce embeddings for property descriptions and user requirements.

Example:

```
User:

"I want a peaceful family-friendly community
close to schools and parks."

                    ↓

User Embedding
                    ↓
Vector Search
                    ↓
Semantically Similar Properties
```

This allows Hi Pando to understand preferences that cannot easily be represented using structured fields.

Potential implementation:

```
Property Description
        ↓
Embedding Model
        ↓
Vector Representation
        ↓
Vector Database / Search
```

### 4.4 Similar Property Recommendations

If a user interacts positively with a property:

```
User likes Property A
        ↓
Find similar properties
        ↓
Rank similar properties
        ↓
Recommend alternatives
```

Example:

```
User likes:
2BR Apartment, Dubai Marina, AED 1.6M, Near Metro

Recommend:
2BR Apartment, JLT, AED 1.5M, Near Metro
```

### 4.5 Continuous Learning

Create a feedback loop.

```
User Interaction
       ↓
Event Tracking
       ↓
Data Storage
       ↓
Training Dataset
       ↓
Model Retraining
       ↓
Model Evaluation
       ↓
Production Model
       ↓
New Recommendations
       ↓
User Interaction
       └───────────────┘
```

Retraining frequency can initially be scheduled periodically and adjusted based on data volume and model drift.

### 4.6 Recommendation Personalization

The system should progressively learn:

- What properties does the user view?
- What properties does the user save?
- What properties does the user reject?
- Which locations does the user repeatedly explore?
- What price range does the user actually consider?
- Which property features influence their actions?

This allows the system to distinguish **what the user says they want** from **what the user actually engages with**. That distinction becomes one of the strongest signals in the recommendation system.

### 4.7 Recommendation Diversity

Avoid recommending 10 nearly identical properties.

Introduce diversity into the final ranking.

Example — Top 10:

- 4 × Strong preference matches
- 2 × Slightly cheaper alternatives
- 2 × Similar properties in nearby locations
- 1 × Higher-end option
- 1 × Investment-focused alternative

This gives the AI advisor room to discover alternatives instead of repeatedly showing the same type of property.

### 4.8 Production Monitoring

**Data**

- Missing features
- Data freshness
- Property inventory changes
- Duplicate properties

**Model**

- Precision@K
- Recall@K
- NDCG@K
- CTR
- Save rate
- Conversion rate
- Model drift

**Business**

- Property views
- Shortlists
- Broker contacts
- Viewing requests
- Successful property matches

### Deliverables

- Hybrid recommendation engine
- Semantic/embedding-based search
- Similar-property recommendation
- Personalized ranking
- Recommendation diversity
- Continuous learning pipeline
- Model monitoring
- Production recommendation dashboard

---

## Overall Execution Roadmap

```
PHASE 1
Data Foundation
      │
      ▼
Property Dataset
      │
      ▼
Feature Engineering
      │
      ▼
PHASE 2
Cold-Start Recommendation
      │
      ▼
User DNA
      │
      ▼
Content-Based Matching
      │
      ▼
Weighted Scoring
      │
      ▼
Initial Recommendations
      │
      ▼
PHASE 3
Behavioral Learning
      │
      ▼
Interaction Tracking
      │
      ▼
Training Dataset
      │
      ▼
ML Ranking Model
      │
      ▼
PHASE 4
Hybrid Intelligence
      │
      ▼
ML + Content + Behavior
      │
      ▼
Semantic Matching
      │
      ▼
Personalization
      │
      ▼
Continuous Learning
```

## Recommended Technology Stack

**Data**
- MongoDB
- Python
- Pandas
- NumPy

**Machine Learning**
- Scikit-learn
- XGBoost / LightGBM

**NLP / Semantic Search**
- Sentence Transformers or an embedding API
- Vector database/search layer

**Recommendation Engine**
- Python
- FastAPI
- MongoDB

**Model Tracking**
- MLflow

**Analytics**
- Python
- Power BI / internal dashboard

## Application Integration

```
Hi Pando Frontend
        ↓
AI Advisor
        ↓
Recommendation API
        ↓
Recommendation Engine
        ↓
MongoDB
```

## Final Target Architecture

```
                    ┌──────────────────┐
                    │    Hi Pando UI    │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  AI Advisor       │
                    │  Conversation     │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    User DNA       │
                    └────────┬──────────┘
                             │
                             ▼
                ┌───────────────────────────┐
                │ Recommendation Engine     │
                │                           │
                │ Content Matching          │
                │ ML Ranking                │
                │ Semantic Matching         │
                │ Behavioral Signals        │
                │ Diversity                 │
                └────────────┬──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Property Ranking  │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Top N Properties  │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   User Actions    │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Interaction Data  │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Training Pipeline │
                    └────────┬──────────┘
                             │
                             └──────────► Recommendation Engine
```

## Success Criteria

The project should not be considered successful merely because a model produces a score.

The progression should be:

- **Phase 1** — Can Hi Pando understand and structure its property inventory?
- **Phase 2** — Can Hi Pando recommend reasonable properties with zero historical user data?
- **Phase 3** — Can Hi Pando learn from actual user interactions?
- **Phase 4** — Can Hi Pando continuously personalize and improve recommendations?

The critical design principle is:

> Start with an explainable recommendation system, collect interaction data, then use that data to train the ML model.

Do not manufacture historical user behavior just to train a model. Synthetic data is useful for development and testing, but the eventual ML model should learn from real Hi Pando user interactions.
