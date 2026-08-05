# UC-006: Process Harvested Birds — API Documentation

## Overview

The Harvest Processing API enables processing of live birds from production cycles into inventory-ready cuts. This covers the complete workflow from selecting a production cycle through to creating inventory items for each cut type.

**Actor:** Processing Staff  
**Base URL:** `/api/harvest`  
**Authentication:** Required (Bearer token)

---

## Endpoints

### 1. Process Harvest

**POST** `/api/harvest/process`

Converts live birds from a production cycle into processed inventory cuts and batches.

**Request Body:**
```json
{
  "cycleId": "string (required)",
  "harvestDate": "Date (required)",
  "liveBirdsCount": "number (required, > 0)",
  "averageLiveWeight": "number (required, > 0, kg per bird)",
  "cuts": [
    {
      "cutType": "whole | breast | thighs | wings | drumsticks | legs | giblets | feet | back | neck (required)",
      "weight": "number (required, > 0, kg)",
      "count": "number (required, > 0, pieces)",
      "grade": "A | B | C (required)",
      "storageLocation": "string (required)"
    }
  ],
  "qualityChecks": [
    {
      "cutType": "string (optional, defaults to all cuts)",
      "result": "pass | fail | conditional",
      "notes": "string (optional)",
      "temperature": "number (optional, Celsius)",
      "phLevel": "number (optional)"
    }
  ],
  "storage": {
    "primaryLocation": "string (required)",
    "temperature": "number (required, Celsius)",
    "humidity": "number (required, percentage)",
    "expectedShelfLife": "number (required, days)"
  },
  "notes": "string (optional)"
}
```

**Validation Rules:**
- `cycleId` must reference an existing production cycle with status `in_progress`
- `liveBirdsCount` must not exceed surviving birds (started - mortality)
- Total cut weight must not exceed total live weight
- Each cut must have a valid `cutType` from the enum
- `grade` must be A, B, or C

**Response (201):**
```json
{
  "success": true,
  "message": "Harvest processed successfully",
  "data": {
    "id": "harvest_batch_id",
    "batchNumber": "HARV-20260626-001",
    "cycleId": "production_cycle_id",
    "harvestDate": "2026-06-26T00:00:00.000Z",
    "liveBirdsCount": 500,
    "averageLiveWeight": 2.5,
    "totalLiveWeight": 1250,
    "cuts": [
      {
        "cutType": "breast",
        "productSubcategory": "chicken_breast",
        "weight": 312.5,
        "count": 500,
        "grade": "A",
        "storageLocation": "Cold Room A",
        "batchId": "inventory_batch_id"
      }
    ],
    "totalProcessedWeight": 1100,
    "totalWasteWeight": 150,
    "overallYieldPercentage": 88,
    "qualityChecks": [],
    "storage": {
      "primaryLocation": "Cold Room A",
      "temperature": 2,
      "humidity": 70,
      "storageDate": "2026-06-26T10:30:00.000Z",
      "expectedShelfLife": 7
    },
    "status": "completed",
    "processedBy": "user_id",
    "createdAt": "2026-06-26T10:30:00.000Z"
  }
}
```

**Side Effects:**
- Creates batch records in `batches` collection for each cut
- Creates inventory items in `inventory_items` collection
- Creates inventory adjustment records for audit trail
- Updates production cycle status to `completed`
- Resolves product IDs from product catalog (creates products if not found)
- Resolves storage location IDs (creates locations if not found)

---

### 2. Get Harvest Batch

**GET** `/api/harvest/batches/:id`

Retrieves a single harvest batch by ID.

**Response (200):**
```json
{
  "success": true,
  "data": { /* HarvestBatch object */ }
}
```

**Error (404):** Batch not found

---

### 3. Get Harvest Batches

**GET** `/api/harvest/batches`

Retrieves harvest batches with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `cycleId` | string | - | Filter by production cycle |
| `status` | string | - | Filter by status |
| `startDate` | date | - | Filter from date |
| `endDate` | date | - | Filter to date |

**Response (200):**
```json
{
  "success": true,
  "data": [ /* HarvestBatch[] */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 4. Get Harvest Batches for Cycle

**GET** `/api/harvest/cycles/:cycleId/batches`

Retrieves all harvest batches for a specific production cycle, ordered by harvest date descending.

---

### 5. Cancel Harvest Batch

**POST** `/api/harvest/batches/:id/cancel`

Cancels a harvest batch and reverses all inventory changes.

**Request Body:**
```json
{
  "reason": "string (optional)"
}
```

**Effects:**
- Sets batch status to `cancelled`
- Deletes inventory items created from this batch
- Creates adjustment records for audit trail
- Reopens the production cycle to `in_progress`

**Error (400):** Batch already cancelled

---

### 6. Get Yield Analysis

**GET** `/api/harvest/batches/:id/yield-analysis`

Calculates per-cut yield analysis comparing actual vs standard yields.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "cutType": "breast",
      "liveWeight": 1250,
      "processedWeight": 312.5,
      "wasteWeight": 15.6,
      "yieldPercentage": 25,
      "wastePercentage": 1.25,
      "standardYield": 25,
      "variance": 0
    }
  ]
}
```

---

### 7. Get Harvest Analytics

**GET** `/api/harvest/analytics`

Returns aggregate harvest analytics with optional date range.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | date | Start of date range |
| `endDate` | date | End of date range |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalBirdsHarvested": 5000,
    "totalLiveWeight": 12500,
    "totalProcessedWeight": 10500,
    "totalWasteWeight": 2000,
    "averageYieldPercentage": 84,
    "yieldByCutType": {
      "breast": { "totalWeight": 3125, "averageYield": 25, "count": 5 },
      "thighs": { "totalWeight": 1875, "averageYield": 15, "count": 5 }
    },
    "monthlyHarvests": [
      { "month": "2026-06", "birdsCount": 5000, "liveWeight": 12500, "processedWeight": 10500, "yieldPercentage": 84 }
    ],
    "topPerformingCuts": [
      { "cutType": "breast", "averageYield": 25, "totalWeight": 3125 }
    ]
  }
}
```

---

### 8. Get Cut Types

**GET** `/api/harvest/cut-types`

Returns available cut types with standard yield percentages.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "value": "whole", "label": "Whole", "standardYield": 70, "productSubcategory": "whole_chicken" },
    { "value": "breast", "label": "Breast", "standardYield": 25, "productSubcategory": "chicken_breast" },
    { "value": "thighs", "label": "Thighs", "standardYield": 15, "productSubcategory": "chicken_thighs" },
    { "value": "wings", "label": "Wings", "standardYield": 10, "productSubcategory": "chicken_wings" },
    { "value": "drumsticks", "label": "Drumsticks", "standardYield": 12, "productSubcategory": "chicken_drums" },
    { "value": "legs", "label": "Legs", "standardYield": 14, "productSubcategory": "chicken_leg" },
    { "value": "giblets", "label": "Giblets", "standardYield": 5, "productSubcategory": "chicken_giblets" },
    { "value": "feet", "label": "Feet", "standardYield": 3, "productSubcategory": "chicken_feet" },
    { "value": "back", "label": "Back", "standardYield": 8, "productSubcategory": "chicken_giblets" },
    { "value": "neck", "label": "Neck", "standardYield": 2, "productSubcategory": "chicken_giblets" }
  ]
}
```

---

### 9. Get Harvest Summary

**GET** `/api/harvest/summary`

Returns dashboard summary with configurable time range.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Number of days to include |

---

## Data Models

### HarvestBatch
| Field | Type | Description |
|-------|------|-------------|
| id | string | Firestore document ID |
| batchNumber | string | Format: `HARV-YYYYMMDD-NNN` |
| cycleId | string | Reference to production cycle |
| harvestDate | Date | Date of harvest |
| liveBirdsCount | number | Number of birds harvested |
| averageLiveWeight | Number | Average weight per bird (kg) |
| totalLiveWeight | number | Total live weight (kg) |
| cuts | Cut[] | Array of processed cuts |
| totalProcessedWeight | number | Sum of all cut weights (kg) |
| totalWasteWeight | number | liveWeight - processedWeight (kg) |
| overallYieldPercentage | number | (processedWeight / liveWeight) * 100 |
| qualityChecks | QualityCheck[] | Quality check results |
| storage | StorageInfo | Storage configuration |
| status | HarvestProcessingStatus | pending/in_progress/completed/cancelled |
| notes | string? | Optional notes |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |
| processedBy | string | User ID of processor |
| lastUpdatedBy | string | User ID of last updater |

### CutType Enum
`whole`, `breast`, `thighs`, `wings`, `drumsticks`, `legs`, `giblets`, `feet`, `back`, `neck`

### HarvestProcessingStatus Enum
`pending`, `in_progress`, `completed`, `cancelled`

---

## Integration Points

### Production Cycles
- Harvest requires a production cycle with status `in_progress`
- After harvest, cycle status is updated to `completed`
- Birds harvested and average weight are recorded on the cycle
- Cancelling a harvest reopens the cycle

### Inventory
- Each cut creates a batch record in `batches` collection
- Each cut creates an inventory item in `inventory_items` collection
- Adjustment records are created in `inventory_adjustments` for audit trail
- Products are resolved from `products` collection (auto-created if not found)
- Storage locations are resolved from `storage_locations` collection (auto-created if not found)

### Product Catalog
- Cut types are mapped to product subcategories
- Product IDs are resolved by querying the products collection
- If no matching product exists, a basic product entry is created

---

## Error Responses

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Validation failed | Invalid request body |
| 400 | Production cycle must be in progress | Cycle not in harvestable state |
| 400 | Birds harvested exceeds surviving birds | Count > started - mortality |
| 400 | Total processed weight exceeds live weight | Cut weights > live weight |
| 400 | Harvest batch already cancelled | Duplicate cancellation |
| 404 | Production cycle not found | Invalid cycleId |
| 404 | Harvest batch not found | Invalid batch ID |
| 500 | Firestore is not initialized | Server configuration error |
