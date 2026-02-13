
# Sci-Demo Hub - Backend API Specifications (v1.0)

This document outlines the RESTful API endpoints required to support the Sci-Demo Hub frontend. It is derived from the current TypeScript types and `storageService` logic.

## 1. General Info

*   **Base URL**: `/api/v1`
*   **Authentication**: Bearer Token (JWT) recommended.
*   **Data Format**: `application/json`
*   **Standard Response Wrapper**:
    ```json
    {
      "code": 200,
      "message": "Success",
      "data": { ... }
    }
    ```

## 2. Shared Enum Definitions

Ensure the database schema supports these specific string values found in `types.ts`.

| Enum Name | Values | Description |
| :--- | :--- | :--- |
| **UserRole** | `user`, `general_admin` | Access control levels. |
| **Layer** | `general`, `community` | Content isolation scopes. |
| **DemoStatus** | `pending`, `published`, `rejected` | Content lifecycle. |
| **CommStatus** | `pending`, `approved`, `rejected` | Community lifecycle. |

---

## 3. Endpoints

### 3.1 Authentication (Auth)

*Note: Frontend currently mocks IDs ('user-101', 'admin-001'). Backend must provide real IDs.*

| Method | Endpoint | Description | Request Body | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | User login | `{ "username": "...", "password": "..." }` | `{ "token": "jwt...", "user": { "id": "...", "role": "..." } }` |
| **GET** | `/auth/me` | Get current user | - | `{ "id": "...", "role": "..." }` |

---

### 3.2 Demos (Demonstrations)

Supports `DemoPlayer`, `UploadWizard`, and `Gallery` components.

#### **GET** `/demos`
Fetch list of demos with filtering.
*   **Query Params**:
    *   `layer`: `general` | `community` (Required)
    *   `communityId`: UUID (Required if `layer=community`)
    *   `categoryId`: String/UUID (Optional)
    *   `search`: String (Search title/description)
    *   `status`: `published` (default for users), `pending` (for admins)
    *   `authorId`: UUID (Optional, for Profile view)

#### **POST** `/demos`
Upload a new demo.
*   **Request Body**:
    ```json
    {
      "title": "String",
      "description": "String",
      "categoryId": "String", // Subject Enum for General, Category UUID for Community
      "layer": "general" | "community",
      "communityId": "UUID (Optional)",
      "code": "String (HTML/JS Content)",
      "bountyId": "UUID (Optional)"
    }
    ```
*   **Logic**: Set `status` to `pending` by default.

#### **GET** `/demos/:id`
Get full details of a specific demo.

#### **PATCH** `/demos/:id/status`
Review a demo (Approve/Reject).
*   **Permission**: General Admin (for General layer) OR Community Admin (for Community layer).
*   **Request Body**:
    ```json
    {
      "status": "published" | "rejected",
      "rejectionReason": "String (Optional)"
    }
    ```

#### **PATCH** `/demos/:id/cover`
Update the thumbnail.
*   **Request Body**:
    ```json
    {
      "thumbnailUrl": "Base64 String" 
    }
    ```
*   *Note: Frontend sends Base64. Backend can save as is or upload to S3 and store URL.*

#### **DELETE** `/demos/:id`
Delete a demo.

---

### 3.3 Communities

Supports `CommunityHall` and Admin Dashboard.

#### **GET** `/communities`
List communities.
*   **Query Params**:
    *   `status`: `approved` | `pending`
    *   `userId`: UUID (Optional, to fetch "My Communities")

#### **POST** `/communities`
Request to create a new community.
*   **Request Body**:
    ```json
    {
      "name": "String",
      "description": "String"
    }
    ```
*   **Logic**:
    1. Generate a 12-character random string for `code`.
    2. Set `status` to `pending`.
    3. Add creator to `members` list automatically.

#### **PATCH** `/communities/:id/status`
Global Admin approval.
*   **Permission**: `general_admin`
*   **Request Body**: `{ "status": "approved" | "rejected" }`

#### **POST** `/communities/join-by-code`
Join immediately via code.
*   **Request Body**: `{ "code": "12-char-string" }`
*   **Logic**:
    1. Find community with matching code AND `status=approved`.
    2. If found, add user to `members`.
    3. Remove user from `pendingMembers` if they were there.

#### **POST** `/communities/:id/join-request`
Request to join (without code).
*   **Logic**: Add user ID to `pendingMembers` array.

#### **POST** `/communities/:id/members/manage`
Community Admin manages members.
*   **Permission**: Community Creator.
*   **Request Body**:
    ```json
    {
      "userId": "UUID",
      "action": "accept" | "kick" | "reject_request"
    }
    ```
*   **Logic**:
    *   `accept`: Move from `pendingMembers` to `members`.
    *   `kick`: Remove from `members`.
    *   `reject_request`: Remove from `pendingMembers`.

#### **PATCH** `/communities/:id/code`
Reset invite code.
*   **Permission**: Community Creator.
*   **Response**: `{ "code": "new-12-char-string" }`

---

### 3.4 Categories

Supports the recursive tree view (`CategoryTreeNode`).

#### **GET** `/categories`
Get category list.
*   **Query Params**:
    *   `layer`: `general` | `community`
    *   `communityId`: UUID (Required if community layer)
*   **Response**: Flat list of categories. Frontend handles tree reconstruction based on `parentId`.

#### **POST** `/categories`
*   **Request Body**:
    ```json
    {
      "name": "String",
      "parentId": "UUID (or null for root)",
      "communityId": "UUID (Optional)"
    }
    ```

#### **DELETE** `/categories/:id`
*   **Logic**: **Cascade Delete**. Deleting a category must delete all its sub-categories.

---

### 3.5 Bounties

Supports `BountyHall`.

#### **GET** `/bounties`
*   **Query Params**: `layer`, `communityId`.

#### **POST** `/bounties`
*   **Request Body**:
    ```json
    {
      "title": "String",
      "description": "String",
      "reward": "String",
      "layer": "general" | "community",
      "communityId": "UUID (Optional)"
    }
    ```

#### **DELETE** `/bounties/:id`
Delete a bounty.

---

### 3.6 AI Assistant

Supports `GeminiService`.

#### **POST** `/ai/chat`
Proxy endpoint to hide API keys.
*   **Request Body**:
    ```json
    {
      "prompt": "String",
      "context": "String (Optional, usually code snippet)"
    }
    ```
*   **Backend Implementation**: Call OpenAI/Gemini API using server-side environment variables (`API_KEY`).
*   **Response**: `{ "text": "AI generated response..." }`

---

## 4. Frontend-Backend Integration Notes

1.  **Simulated Latency**: The frontend currently simulates network delay (`800ms`). When integrating real APIs, ensure database queries for the `Demo` list are optimized (indexed by `communityId` and `status`) to maintain performance.
2.  **Mock IDs**: The frontend generates IDs like `demo-12345678`. The backend should replace these with robust UUIDs or database auto-increment IDs.
3.  **Security**:
    *   Ensure `layer=community` content is strictly guarded. A user cannot view `demos` or `bounties` of a community they are not a member of (unless they are `general_admin`).
