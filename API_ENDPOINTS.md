# Frontend API Endpoints

Tai lieu nay tong hop toan bo endpoint backend de frontend ghep API truc tiep.

## Thong tin chung

- Base URL local: `http://localhost:8080/api/v1`
- Swagger UI: `GET /api-docs`
- Global prefix: `/api/v1` (theo chuan social-platform-be). Vi du: `POST /api/v1/auth/login`.
- Cac route can auth su dung header:

```http
Authorization: Bearer <accessToken>
```

- Validation dang bat `whitelist + forbidNonWhitelisted`, khong nen gui field thua
- Da so `id` tra ve trong response da duoc convert sang `string`
- `fileUrl`, `avatarUrl`, `coverUrl` thuong la relative path, vi du: `"/uploads/abc.jpg"`

## Enum FE can dung

### UserRole

- `USER`
- `ADMIN`

### UserStatus

- `ACTIVE`
- `INACTIVE`
- `LOCKED`
- `BANNED`

### PostVisibility

- `PUBLIC`
- `FOLLOWERS`
- `PRIVATE`

### PostStatus

- `PUBLISHED`
- `HIDDEN`
- `DELETED`

### ReactionType

- `LIKE`
- `LOVE`
- `HAHA`
- `WOW`
- `SAD`
- `ANGRY`

### NotificationType

- `LIKE_POST`
- `COMMENT_POST`
- `FOLLOW_USER`
- `MESSAGE`

### UploadType

- `AVATAR`
- `COVER`
- `POST_IMAGE`
- `CHAT_IMAGE`
- `OTHER`

### ConversationType

- `DIRECT`
- `GROUP`

### MessageType

- `TEXT`
- `IMAGE`
- `FILE`
- `SYSTEM`

### MessageStatus

- `SENT`
- `DELIVERED`
- `SEEN`
- `DELETED`

## 1. Auth

### `POST /auth/register`

- Auth: public
- Body:

```json
{
  "name": "Nguyen Van A",
  "email": "a@gmail.com",
  "password": "12345678"
}
```

- Response:

```json
{
  "message": "Dang ky thanh cong",
  "user": {
    "id": "1",
    "name": "Nguyen Van A",
    "email": "a@gmail.com",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `POST /auth/login`

- Auth: public
- Body:

```json
{
  "email": "a@gmail.com",
  "password": "12345678"
}
```

- Response:

```json
{
  "message": "Dang nhap thanh cong",
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "user": {
    "id": "1",
    "name": "Nguyen Van A",
    "email": "a@gmail.com",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

### `POST /auth/refresh`

- Auth: public
- Body:

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

- Response:

```json
{
  "message": "Lam moi token thanh cong",
  "accessToken": "<new_access_token>",
  "refreshToken": "<new_refresh_token>"
}
```

### `POST /auth/logout`

- Auth: public
- Body:

```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

- Response:

```json
{
  "message": "Dang xuat thanh cong"
}
```

### `GET /auth/me`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay thong tin tai khoan thanh cong",
  "user": {
    "id": "1",
    "name": "Nguyen Van A",
    "email": "a@gmail.com",
    "avatarUrl": "/uploads/avatar.jpg",
    "coverUrl": "/uploads/cover.jpg",
    "bio": "Hello",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerifiedAt": null,
    "lastLoginAt": "2026-05-09T10:00:00.000Z",
    "createdAt": "2026-05-01T10:00:00.000Z"
  }
}
```

## 2. Users

### `GET /users`

- Auth: Bearer + `ADMIN`
- Query:
  - `page`: number, default `1`
  - `limit`: number, default `20`
  - `search`: string

- Vi du:

```http
GET /users?page=1&limit=20&search=nguyen
```

- Response:

```json
{
  "message": "Lay danh sach nguoi dung thanh cong",
  "users": [
    {
      "id": "1",
      "name": "Nguyen Van A",
      "email": "a@gmail.com",
      "avatarUrl": null,
      "coverUrl": null,
      "bio": null,
      "role": "USER",
      "status": "ACTIVE",
      "emailVerifiedAt": null,
      "lastLoginAt": null,
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /users/me`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay thong tin nguoi dung thanh cong",
  "user": {
    "id": "1",
    "name": "Nguyen Van A",
    "email": "a@gmail.com",
    "avatarUrl": null,
    "coverUrl": null,
    "bio": null,
    "role": "USER",
    "status": "ACTIVE",
    "emailVerifiedAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
  }
}
```

### `PATCH /users/me`

- Auth: Bearer
- Body:

```json
{
  "name": "Nguyen Van B",
  "bio": "Xin chao"
}
```

- Response:

```json
{
  "message": "Cap nhat ho so thanh cong",
  "user": {
    "id": "1",
    "name": "Nguyen Van B",
    "email": "a@gmail.com",
    "avatarUrl": null,
    "coverUrl": null,
    "bio": "Xin chao",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerifiedAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /users/me/avatar`

- Auth: Bearer
- Ho tro 2 cach goi

#### Cach 1: JSON

```json
{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### Cach 2: `multipart/form-data`

- field file: `file`

- Response:

```json
{
  "message": "Cap nhat avatar thanh cong",
  "user": {
    "id": "1",
    "name": "Nguyen Van A",
    "email": "a@gmail.com",
    "avatarUrl": "/uploads/abc.jpg",
    "coverUrl": null,
    "bio": null,
    "role": "USER",
    "status": "ACTIVE",
    "emailVerifiedAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /users/me/cover`

- Auth: Bearer
- JSON:

```json
{
  "coverUrl": "https://example.com/cover.jpg"
}
```

- Hoac `multipart/form-data` voi field `file`
- Response giong `avatar` nhung cap nhat `coverUrl`

### `GET /users/:id`

- Auth: public
- Response:

```json
{
  "message": "Lay thong tin public cua nguoi dung thanh cong",
  "user": {
    "id": "2",
    "name": "Tran Van C",
    "avatarUrl": null,
    "coverUrl": null,
    "bio": "Hello"
  }
}
```

## 3. Posts

### `POST /posts`

- Auth: Bearer
- Body:

```json
{
  "content": "Xin chao moi nguoi",
  "visibility": "PUBLIC"
}
```

- Luu y: `content` thuc te khong duoc rong
- Response:

```json
{
  "message": "Tao bai viet thanh cong",
  "post": {
    "id": "10",
    "content": "Xin chao moi nguoi",
    "visibility": "PUBLIC",
    "status": "PUBLISHED",
    "commentCount": 0,
    "reactionCount": 0,
    "shareCount": 0,
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z",
    "user": {
      "id": "1",
      "name": "Nguyen Van A",
      "email": "a@gmail.com",
      "avatarUrl": null
    }
  }
}
```

### `GET /posts`

- Auth: public
- Response:

```json
{
  "message": "Lay danh sach bai viet thanh cong",
  "posts": [
    {
      "id": "10",
      "content": "Xin chao moi nguoi",
      "visibility": "PUBLIC",
      "status": "PUBLISHED",
      "commentCount": 0,
      "reactionCount": 0,
      "shareCount": 0,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "1",
        "name": "Nguyen Van A",
        "avatarUrl": null
      }
    }
  ]
}
```

### `GET /posts/me`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay bai viet cua toi thanh cong",
  "posts": [
    {
      "id": "10",
      "content": "Xin chao moi nguoi",
      "visibility": "PUBLIC",
      "status": "PUBLISHED",
      "commentCount": 0,
      "reactionCount": 0,
      "shareCount": 0,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:00:00.000Z"
    }
  ]
}
```

### `GET /posts/:id`

- Auth: public
- Response:

```json
{
  "message": "Lay chi tiet bai viet thanh cong",
  "post": {
    "id": "10",
    "content": "Xin chao moi nguoi",
    "visibility": "PUBLIC",
    "status": "PUBLISHED",
    "commentCount": 1,
    "reactionCount": 2,
    "shareCount": 0,
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z",
    "user": {
      "id": "1",
      "name": "Nguyen Van A",
      "avatarUrl": null,
      "bio": "Hello"
    }
  }
}
```

### `PATCH /posts/:id`

- Auth: Bearer
- Body:

```json
{
  "content": "Noi dung moi",
  "visibility": "FOLLOWERS"
}
```

- Response:

```json
{
  "message": "Cap nhat bai viet thanh cong",
  "post": {
    "id": "10",
    "content": "Noi dung moi",
    "visibility": "FOLLOWERS",
    "status": "PUBLISHED",
    "commentCount": 1,
    "reactionCount": 2,
    "shareCount": 0,
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T11:00:00.000Z"
  }
}
```

## 4. Comments

### `POST /comments`

- Auth: Bearer
- Body:

```json
{
  "content": "Bai viet hay qua",
  "postId": "10",
  "parentId": "20"
}
```

- `parentId` la optional, dung khi reply comment
- Response:

```json
{
  "message": "Tao binh luan thanh cong",
  "comment": {
    "id": "21",
    "postId": "10",
    "userId": "1",
    "parentId": "20",
    "content": "Bai viet hay qua",
    "status": "ACTIVE",
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z",
    "user": {
      "id": "1",
      "name": "Nguyen Van A",
      "avatarUrl": null
    }
  }
}
```

### `GET /comments/post/:postId`

- Auth: public
- Response:

```json
{
  "message": "Lay danh sach binh luan thanh cong",
  "comments": [
    {
      "id": "21",
      "postId": "10",
      "userId": "1",
      "parentId": null,
      "content": "Bai viet hay qua",
      "status": "ACTIVE",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "1",
        "name": "Nguyen Van A",
        "avatarUrl": null
      }
    }
  ]
}
```

### `PATCH /comments/:id`

- Auth: Bearer
- Body:

```json
{
  "content": "Noi dung da sua"
}
```

- Response:

```json
{
  "message": "Cap nhat binh luan thanh cong",
  "comment": {
    "id": "21",
    "postId": "10",
    "userId": "1",
    "parentId": null,
    "content": "Noi dung da sua",
    "status": "ACTIVE",
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T11:00:00.000Z"
  }
}
```

### `DELETE /comments/:id`

- Auth: Bearer
- Response:

```json
{
  "message": "Xoa binh luan thanh cong"
}
```

## 5. Reactions

### `POST /reactions`

- Auth: Bearer
- Body:

```json
{
  "postId": "10",
  "type": "LIKE"
}
```

- Response khi tao moi:

```json
{
  "message": "Tha cam xuc thanh cong",
  "reaction": {
    "id": "5",
    "userId": "1",
    "postId": "10",
    "type": "LIKE",
    "createdAt": "2026-05-09T10:00:00.000Z"
  }
}
```

- Response khi doi reaction:

```json
{
  "message": "Cap nhat cam xuc thanh cong",
  "reaction": {
    "id": "5",
    "userId": "1",
    "postId": "10",
    "type": "LOVE",
    "createdAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `DELETE /reactions/post/:postId`

- Auth: Bearer
- Response:

```json
{
  "message": "Bo cam xuc thanh cong"
}
```

### `GET /reactions/post/:postId`

- Auth: public
- Response:

```json
{
  "message": "Lay danh sach cam xuc thanh cong",
  "reactions": [
    {
      "id": "5",
      "userId": "1",
      "postId": "10",
      "type": "LIKE",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "1",
        "name": "Nguyen Van A",
        "avatarUrl": null
      }
    }
  ]
}
```

## 6. Follows

### `POST /follows`

- Auth: Bearer
- Body:

```json
{
  "followingId": "2"
}
```

- Response:

```json
{
  "message": "Theo doi nguoi dung thanh cong",
  "follow": {
    "id": "3",
    "followerId": "1",
    "followingId": "2",
    "createdAt": "2026-05-09T10:00:00.000Z",
    "following": {
      "id": "2",
      "name": "Tran Van C",
      "email": "c@gmail.com",
      "avatarUrl": null
    }
  }
}
```

### `DELETE /follows/:userId`

- Auth: Bearer
- Response:

```json
{
  "message": "Bo theo doi thanh cong"
}
```

### `GET /follows/followers/:userId`

- Auth: public
- Response:

```json
{
  "message": "Lay danh sach follower thanh cong",
  "followers": [
    {
      "id": "3",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "1",
        "name": "Nguyen Van A",
        "email": "a@gmail.com",
        "avatarUrl": null,
        "bio": null
      }
    }
  ]
}
```

### `GET /follows/following/:userId`

- Auth: public
- Response:

```json
{
  "message": "Lay danh sach dang theo doi thanh cong",
  "following": [
    {
      "id": "3",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "2",
        "name": "Tran Van C",
        "email": "c@gmail.com",
        "avatarUrl": null,
        "bio": null
      }
    }
  ]
}
```

### `GET /follows/check/:userId`

- Auth: Bearer
- Response:

```json
{
  "message": "Kiem tra trang thai theo doi thanh cong",
  "isFollowing": true
}
```

## 7. Feed

### `GET /feeds/me`

- Auth: Bearer
- Query:
  - `page`: default `1`
  - `limit`: default `10`

- Vi du:

```http
GET /feeds/me?page=1&limit=10
```

- Response:

```json
{
  "message": "Lay bang tin thanh cong",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  },
  "posts": [
    {
      "id": "10",
      "userId": "2",
      "content": "Hello",
      "visibility": "PUBLIC",
      "status": "PUBLISHED",
      "commentCount": 1,
      "reactionCount": 2,
      "shareCount": 0,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "2",
        "name": "Tran Van C",
        "avatarUrl": null
      },
      "reactions": [
        {
          "id": "5",
          "type": "LIKE"
        }
      ],
      "myReaction": "LIKE"
    }
  ]
}
```

- FE nen uu tien dung `myReaction`

## 8. Notifications

### `GET /notifications`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay danh sach thong bao thanh cong",
  "notifications": [
    {
      "id": "1",
      "userId": "1",
      "actorId": "2",
      "type": "FOLLOW_USER",
      "postId": null,
      "commentId": null,
      "messageId": null,
      "contentSnapshot": null,
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "actor": {
        "id": "2",
        "name": "Tran Van C",
        "avatarUrl": null
      }
    }
  ]
}
```

### `GET /notifications/unread-count`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay so luong thong bao chua doc thanh cong",
  "unreadCount": 3
}
```

### `PATCH /notifications/:id/read`

- Auth: Bearer
- Response:

```json
{
  "message": "Danh dau thong bao da doc thanh cong"
}
```

- Neu da doc truoc do:

```json
{
  "message": "Thong bao da duoc danh dau doc truoc do"
}
```

### `PATCH /notifications/read-all`

- Auth: Bearer
- Response:

```json
{
  "message": "Danh dau tat ca thong bao da doc thanh cong"
}
```

## 9. Uploads

### `POST /uploads/single`

- Auth: Bearer
- Content-Type: `multipart/form-data`
- Fields:
  - `file`: file binary
  - `uploadType`: optional

- Response:

```json
{
  "message": "Tai file len thanh cong",
  "upload": {
    "id": "1",
    "userId": "1",
    "fileUrl": "/uploads/abc.jpg",
    "fileName": "photo.jpg",
    "mimeType": "image/jpeg",
    "fileSize": "123456",
    "uploadType": "POST_IMAGE",
    "createdAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `POST /uploads/multiple`

- Auth: Bearer
- Content-Type: `multipart/form-data`
- Fields:
  - `files`: multiple file
  - `uploadType`: optional

- Response:

```json
{
  "message": "Tai nhieu file len thanh cong",
  "uploads": [
    {
      "id": "1",
      "userId": "1",
      "fileUrl": "/uploads/a.jpg",
      "fileName": "a.jpg",
      "mimeType": "image/jpeg",
      "fileSize": "123456",
      "uploadType": "POST_IMAGE",
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ]
}
```

### `GET /uploads/me`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay danh sach file thanh cong",
  "uploads": [
    {
      "id": "1",
      "userId": "1",
      "fileUrl": "/uploads/a.jpg",
      "fileName": "a.jpg",
      "mimeType": "image/jpeg",
      "fileSize": "123456",
      "uploadType": "POST_IMAGE",
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ]
}
```

### `DELETE /uploads/:id`

- Auth: Bearer
- Response:

```json
{
  "message": "Xoa file thanh cong"
}
```

## 10. Chats

### `POST /chats/direct`

- Auth: Bearer
- Body:

```json
{
  "targetUserId": "2"
}
```

- Response neu da co room:

```json
{
  "message": "Cuoc tro chuyen da ton tai",
  "conversation": {
    "id": "1",
    "type": "DIRECT"
  }
}
```

- Response neu tao moi:

```json
{
  "message": "Tao cuoc tro chuyen rieng thanh cong",
  "conversation": {
    "id": "1",
    "type": "DIRECT",
    "title": null,
    "createdAt": "2026-05-09T10:00:00.000Z",
    "participants": [
      {
        "id": "1",
        "userId": "1",
        "joinedAt": "2026-05-09T10:00:00.000Z",
        "user": {
          "id": "1",
          "name": "Nguyen Van A",
          "avatarUrl": null
        }
      }
    ]
  }
}
```

### `POST /chats/group`

- Auth: Bearer
- Body:

```json
{
  "title": "Nhom ban than",
  "participantIds": ["2", "3"]
}
```

- Response:

```json
{
  "message": "Tao nhom chat thanh cong",
  "conversation": {
    "id": "2",
    "type": "GROUP",
    "title": "Nhom ban than",
    "createdAt": "2026-05-09T10:00:00.000Z",
    "participants": [
      {
        "id": "1",
        "userId": "1",
        "isAdmin": true,
        "joinedAt": "2026-05-09T10:00:00.000Z",
        "user": {
          "id": "1",
          "name": "Nguyen Van A",
          "avatarUrl": null
        }
      }
    ]
  }
}
```

### `GET /chats`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay danh sach cuoc tro chuyen thanh cong",
  "conversations": [
    {
      "id": "1",
      "type": "DIRECT",
      "title": null,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:30:00.000Z",
      "lastMessage": {
        "id": "100",
        "content": "Xin chao",
        "type": "TEXT",
        "createdAt": "2026-05-09T10:30:00.000Z",
        "sender": {
          "id": "2",
          "name": "Tran Van C"
        }
      },
      "participants": [
        {
          "id": "1",
          "userId": "1",
          "isAdmin": false,
          "user": {
            "id": "1",
            "name": "Nguyen Van A",
            "avatarUrl": null
          }
        }
      ]
    }
  ]
}
```

### `GET /chats/:conversationId`

- Auth: Bearer
- Response:

```json
{
  "message": "Lay chi tiet cuoc tro chuyen thanh cong",
  "conversation": {
    "id": "1",
    "type": "DIRECT",
    "title": null,
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:30:00.000Z",
    "participants": [
      {
        "id": "1",
        "userId": "1",
        "isAdmin": false,
        "joinedAt": "2026-05-09T10:00:00.000Z",
        "user": {
          "id": "1",
          "name": "Nguyen Van A",
          "avatarUrl": null,
          "email": "a@gmail.com"
        }
      }
    ]
  }
}
```

### `POST /chats/:conversationId/messages`

- Auth: Bearer
- Body:

```json
{
  "content": "Xin chao, ban khoe khong?",
  "replyToMessageId": "99"
}
```

- `replyToMessageId` optional
- Response:

```json
{
  "message": "Gui tin nhan thanh cong",
  "data": {
    "id": "100",
    "conversationId": "1",
    "senderId": "1",
    "type": "TEXT",
    "content": "Xin chao, ban khoe khong?",
    "replyToMessageId": "99",
    "status": "SENT",
    "createdAt": "2026-05-09T10:30:00.000Z",
    "updatedAt": "2026-05-09T10:30:00.000Z",
    "sender": {
      "id": "1",
      "name": "Nguyen Van A",
      "avatarUrl": null
    }
  }
}
```

### `GET /chats/:conversationId/messages`

- Auth: Bearer
- Query:
  - `page`: default `1`
  - `limit`: default `20`

- Response:

```json
{
  "message": "Lay danh sach tin nhan thanh cong",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "messages": [
    {
      "id": "100",
      "conversationId": "1",
      "senderId": "1",
      "type": "TEXT",
      "content": "Xin chao",
      "replyToMessageId": null,
      "status": "SENT",
      "createdAt": "2026-05-09T10:30:00.000Z",
      "updatedAt": "2026-05-09T10:30:00.000Z",
      "sender": {
        "id": "1",
        "name": "Nguyen Van A",
        "avatarUrl": null
      }
    }
  ]
}
```

### `PATCH /chats/:conversationId/read`

- Auth: Bearer
- Response neu co tin nhan:

```json
{
  "message": "Danh dau da doc thanh cong",
  "lastReadMessageId": "100"
}
```

- Neu chua co tin nhan:

```json
{
  "message": "Cuoc tro chuyen chua co tin nhan"
}
```

## 11. Admin

Tat ca API duoi day:

- Auth: Bearer
- Role: `ADMIN`

### `PATCH /admin/users/:id/ban`

- Response:

```json
{
  "message": "Khoa nguoi dung thanh cong",
  "user": {
    "id": "2",
    "name": "Tran Van C",
    "email": "c@gmail.com",
    "role": "USER",
    "status": "BANNED",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /admin/users/:id/unban`

- Response:

```json
{
  "message": "Mo khoa nguoi dung thanh cong",
  "user": {
    "id": "2",
    "name": "Tran Van C",
    "email": "c@gmail.com",
    "role": "USER",
    "status": "ACTIVE",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `GET /admin/users`

- Query:
  - `page`
  - `limit`
  - `search`

- Response:

```json
{
  "message": "Lay danh sach nguoi dung thanh cong",
  "data": [
    {
      "id": "1",
      "name": "Nguyen Van A",
      "email": "a@gmail.com",
      "avatarUrl": null,
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### `POST /admin/users`

- Body:

```json
{
  "name": "Admin B",
  "email": "admin2@gmail.com",
  "password": "12345678",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

- Response:

```json
{
  "message": "Tao admin thanh cong",
  "user": {
    "id": "5",
    "name": "Admin B",
    "email": "admin2@gmail.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /admin/roles/:id`

- Body:

```json
{
  "role": "ADMIN"
}
```

- Response:

```json
{
  "message": "Cap nhat quyen thanh cong",
  "user": {
    "id": "2",
    "name": "Tran Van C",
    "email": "c@gmail.com",
    "role": "ADMIN",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /admin/posts/:id/hide`

- Response:

```json
{
  "message": "An bai viet thanh cong",
  "post": {
    "id": "10",
    "userId": "2",
    "content": "Hello",
    "visibility": "PUBLIC",
    "status": "HIDDEN",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `PATCH /admin/posts/:id/approve`

- Response:

```json
{
  "message": "Phe duyet bai viet thanh cong",
  "post": {
    "id": "10",
    "userId": "2",
    "content": "Hello",
    "visibility": "PUBLIC",
    "status": "PUBLISHED",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `DELETE /admin/posts/:id`

- Response:

```json
{
  "message": "Xoa bai viet thanh cong",
  "post": {
    "id": "10",
    "userId": "2",
    "status": "DELETED",
    "deletedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

### `GET /admin/posts`

- Query:
  - `page`
  - `limit`
  - `search`
  - `status`: `PUBLISHED | HIDDEN | DELETED`
  - `sortBy`: `createdAt | likesCount`
  - `order`: `asc | desc`

- Vi du:

```http
GET /admin/posts?page=1&limit=10&search=hello&status=PUBLISHED&sortBy=createdAt&order=desc
```

- Response:

```json
{
  "message": "Lay danh sach bai viet thanh cong",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "posts": [
    {
      "id": "10",
      "content": "Hello",
      "status": "PUBLISHED",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "updatedAt": "2026-05-09T10:00:00.000Z",
      "user": {
        "id": "2",
        "name": "Tran Van C",
        "email": "c@gmail.com"
      }
    }
  ]
}
```

### `GET /admin/reports/users`

- Query:
  - `period`: `week | month | year`

- Response:

```json
{
  "message": "Lay bao cao nguoi dung thanh cong",
  "period": "month",
  "data": {
    "totalUsers": 100,
    "newUsers": 20,
    "bannedUsers": 3,
    "activeUsers": 90
  },
  "range": {
    "from": "2026-04-09T10:00:00.000Z",
    "to": "2026-05-09T10:00:00.000Z"
  }
}
```

### `GET /admin/reports/posts`

- Query:
  - `period`: `week | month | year`

- Response:

```json
{
  "message": "Lay bao cao bai viet thanh cong",
  "period": "month",
  "data": {
    "totalPosts": 300,
    "newPosts": 40,
    "publishedPosts": 250,
    "hiddenPosts": 20,
    "deletedPosts": 30
  },
  "range": {
    "from": "2026-04-09T10:00:00.000Z",
    "to": "2026-05-09T10:00:00.000Z"
  }
}
```

### `GET /admin/logs`

- Response:

```json
{
  "message": "Lay danh sach lich su admin thanh cong",
  "logs": [
    {
      "id": "1",
      "adminId": "5",
      "action": "BAN_USER",
      "targetType": "USER",
      "targetId": "2",
      "reason": "Khoa tai khoan nguoi dung",
      "createdAt": "2026-05-09T10:00:00.000Z",
      "admin": {
        "id": "5",
        "name": "Admin B",
        "email": "admin2@gmail.com"
      }
    }
  ]
}
```

## 12. Goi y flow cho frontend

### Auth flow

1. Login qua `POST /auth/login`
2. Luu `accessToken`, `refreshToken`
3. Neu API tra `401`, goi `POST /auth/refresh`
4. Logout qua `POST /auth/logout`

### Avatar/Cover flow

1. Neu muon upload file truoc, goi `POST /uploads/single`
2. Lay `fileUrl`
3. Goi `PATCH /users/me/avatar` hoac `PATCH /users/me/cover`

### Post flow

1. Tao post qua `POST /posts`
2. Load feed qua `GET /feeds/me`
3. Load detail qua `GET /posts/:id`
4. Load comments qua `GET /comments/post/:postId`
5. React qua `POST /reactions`

### Chat flow

1. Tao hoac lay room direct qua `POST /chats/direct`
2. Load room qua `GET /chats`
3. Load messages qua `GET /chats/:conversationId/messages`
4. Gui tin nhan text qua `POST /chats/:conversationId/messages`
5. Danh dau da doc qua `PATCH /chats/:conversationId/read`

## 13. Luu y quan trong

- `POST /posts` DTO de `content` optional, nhung service van bat buoc `content` khong rong
- Chat API hien tai chi gui text, chua co endpoint gui image/file message
- `GET /posts/:id` hien chi check `deletedAt`, frontend khong nen mac dinh route nay da tu xu ly privacy
- Upload tra relative path, frontend can ghep voi host backend de hien thi anh/file
