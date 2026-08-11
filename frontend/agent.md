# Project Prompt — AI-Powered Notion Clone Frontend

Bạn là một **Senior Frontend Engineer** có kinh nghiệm xây dựng các ứng dụng SaaS lớn như Notion, Linear, Slack và modern productivity tools.

Hãy xây dựng cho tôi một **Notion Clone Frontend** có chất lượng production-ready, sử dụng **Next.js + React + TypeScript**.

## 1. Mục tiêu dự án

Xây dựng một ứng dụng **AI-Powered Knowledge Workspace** lấy cảm hứng từ Notion.

Trong giai đoạn này:

- CHỈ xây dựng Frontend.
- KHÔNG xây dựng Backend.
- KHÔNG kết nối Database thật.
- KHÔNG gọi API thật.
- Sử dụng mock data để mô phỏng dữ liệu.
- Thiết kế code sao cho sau này có thể thay mock data bằng REST API/Server Actions mà không phải viết lại UI.
- Không hard-code dữ liệu trực tiếp trong component.
- Tách rõ UI, state management, mock services và business logic.

Mục tiêu cuối cùng của giai đoạn FE là:

> Có một ứng dụng Notion Clone hoàn chỉnh về giao diện và trải nghiệm người dùng, có thể demo toàn bộ flow bằng mock data.

---

## 2. Tech Stack

Bắt buộc sử dụng:

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- Zustand
- Tiptap
- React Hook Form
- Zod
- TanStack Query
- Framer Motion

Không sử dụng JavaScript thuần nếu TypeScript có thể giải quyết.

Không sử dụng `any` trừ trường hợp thực sự bắt buộc.

---

## 3. Kiến trúc Frontend

Sử dụng architecture theo feature/domain.

Đề xuất:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── settings/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── workspace/
│   ├── page/
│   ├── editor/
│   ├── search/
│   ├── comments/
│   ├── sharing/
│   ├── ai/
│   ├── notifications/
│   └── settings/
│
├── stores/
├── hooks/
├── lib/
├── mock/
├── types/
└── config/
```

Có thể điều chỉnh cấu trúc nếu có lý do kỹ thuật rõ ràng, nhưng phải giữ nguyên nguyên tắc:

- Feature-based architecture
- Separation of concerns
- Reusable components
- UI không chứa business logic phức tạp
- Mock service có interface rõ ràng

---

## 4. Thiết kế UI

Thiết kế theo phong cách:

- Minimal
- Modern
- Professional
- Productivity SaaS
- Giống tinh thần Notion nhưng KHÔNG sao chép pixel-perfect.

Ưu tiên:

- Typography đẹp
- Khoảng trắng hợp lý
- Sidebar rõ ràng
- Editor tập trung vào nội dung
- Micro interaction
- Hover state
- Focus state
- Loading state
- Empty state
- Error state

Không làm giao diện quá màu mè.

Không sử dụng gradient quá mức.

Không sử dụng quá nhiều card.

---

## 5. Layout chính

Desktop layout:

```text
┌───────────────────────────────────────────────┐
│ Top Bar                                       │
├──────────────┬────────────────────────────────┤
│              │                                │
│   Sidebar    │         Main Content            │
│              │                                │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

Sidebar có thể:

- Collapse
- Expand
- Resize nếu hợp lý

Main content phải có max-width phù hợp với trải nghiệm đọc.

---

## 6. Authentication UI

Tạo đầy đủ giao diện:

- Login
- Register
- Forgot Password
- Reset Password
- OAuth buttons

Ở giai đoạn FE:

- Không authentication thật.
- Dùng mock authentication.
- Có thể chuyển giữa authenticated/unauthenticated state.

Login flow phải có loading/error/success state.

---

## 7. Workspace

Tạo Workspace Switcher.

Ví dụ:

- Personal
- Development
- My Projects

Chức năng FE:

- Switch workspace
- Create workspace
- Rename workspace
- Delete workspace
- Workspace settings

Tất cả sử dụng mock data.

---

## 8. Sidebar

Sidebar phải là một trong những component được đầu tư nhiều nhất.

Có:

- Workspace switcher
- Search
- Home
- Favorites
- Recent
- Shared
- Pages tree
- Trash
- Settings

Ví dụ:

```text
Workspace

  Home
  Favorites
  Recent

  ─────────────

  📄 Projects
      📄 Frontend
          📄 React
          📄 Next.js
      📄 Backend

  📄 Interview
  📄 Notes

  ─────────────

  Trash
```

Page tree phải hỗ trợ:

- Nested pages
- Expand/collapse
- Create child page
- Rename
- Duplicate
- Delete
- Favorite
- Context menu
- Drag & Drop

Sử dụng recursive component cho page tree.

---

## 9. Page Management UI

Mỗi Page gồm:

- Icon
- Cover
- Title
- Content
- Breadcrumb
- Last edited information

Header:

```text
[Icon] Page Title
```

Actions:

- Favorite
- Share
- Comments
- More
- AI

Mock actions phải cập nhật UI ngay lập tức.

---

## 10. Rich Text Editor

Sử dụng Tiptap.

Editor phải hỗ trợ:

### Text

- Paragraph
- H1
- H2
- H3

### Formatting

- Bold
- Italic
- Underline
- Strike
- Highlight
- Inline code

### Lists

- Bullet list
- Ordered list
- Task list

### Blocks

- Blockquote
- Divider
- Code block

### Media

- Image
- Link

### Table

- Table
- Table row
- Table cell

Editor phải có:

- Bubble menu
- Floating toolbar
- Slash command
- Placeholder
- Keyboard shortcuts

---

## 11. Slash Command

Khi user nhập:

```text
/
```

Hiển thị command menu.

Các command:

- Text
- Heading
- Heading 2
- Heading 3
- Bullet List
- Numbered List
- Checklist
- Quote
- Code
- Divider
- Image
- Table
- AI

Có search command.

Ví dụ:

```text
/heading
/quote
/image
/ai
```

Command menu phải hỗ trợ:

- Arrow Up
- Arrow Down
- Enter
- Escape

---

## 12. AI UI

Ở giai đoạn này CHƯA gọi AI API.

Chỉ xây dựng UI và mock AI response.

Tạo AI Assistant panel.

Có:

- Ask AI
- Generate
- Rewrite
- Summarize
- Translate
- Explain
- Continue Writing

### AI contextual menu

Khi user select text:

- Improve Writing
- Rewrite
- Summarize
- Translate
- Explain
- Continue Writing

### AI Chat

UI gồm:

- User message
- AI message
- Streaming simulation
- Input
- Send
- Stop
- Retry
- Copy
- Regenerate

Ở mock mode, mô phỏng streaming response bằng delay.

Sau này AI service có thể thay:

```text
mockAIService
```

thành:

```text
realAIService
```

mà không cần sửa UI.

---

## 13. Search

Tạo global search.

Shortcut:

```text
Cmd/Ctrl + K
```

Search modal:

- Recent
- Pages
- Workspace
- Commands

Search results phải hiển thị:

- Icon
- Title
- Breadcrumb
- Matching text

Có:

- Debounce
- Keyboard navigation
- Enter
- Escape

---

## 14. Command Palette

Ctrl/Cmd + K

Commands:

- Create Page
- Search
- Open Settings
- Toggle Dark Mode
- Create Workspace
- Open Trash
- Ask AI

Hỗ trợ:

- Search
- Arrow navigation
- Enter
- Escape

---

## 15. Favorites

Có thể:

- Add favorite
- Remove favorite
- Display favorites
- Reorder favorites

UI phải cập nhật ngay lập tức bằng Zustand.

---

## 16. Recent Pages

Hiển thị các page vừa truy cập.

Mock logic:

Khi mở Page:

- Update `lastOpenedAt`
- Đưa Page lên Recent

---

## 17. Trash

Trash page:

- List deleted pages
- Restore
- Delete permanently
- Empty trash

Có confirmation dialog trước khi xóa vĩnh viễn.

---

## 18. Sharing UI

Tạo Share Dialog.

Các trạng thái:

- Private
- Anyone with link
- Shared with people

Permission:

- Viewer
- Editor

Chưa cần backend.

Chỉ mô phỏng state.

---

## 19. Comments UI

Tạo comment system ở frontend.

Có:

- Comment list
- Add comment
- Reply
- Resolve
- Delete
- Mention UI

Chưa cần realtime.

---

## 20. Notifications

Notification center.

Các loại:

- Comment
- Mention
- Share
- System

Có:

- Read/unread
- Mark as read
- Mark all as read

---

## 21. Settings

Tạo Settings page.

Sections:

### Account

- Name
- Avatar
- Email

### Appearance

- Light
- Dark
- System

### Editor

- Font size
- Line height
- Full width

### AI

- AI enabled
- AI model UI
- Response style

Tất cả là frontend state.

---

## 22. Theme

Hỗ trợ:

- Light
- Dark
- System

Theme phải persist bằng localStorage.

Không gây flash sai theme khi load page.

---

## 23. Responsive

Bắt buộc hỗ trợ:

- Desktop
- Laptop
- Tablet
- Mobile

Mobile:

- Sidebar trở thành drawer.
- Editor phải responsive.
- AI panel trở thành sheet/drawer.
- Search trở thành full-screen modal.

---

## 24. Loading States

Mỗi feature phải có:

- Loading
- Skeleton
- Empty
- Error

Không được để màn hình trắng khi loading.

---

## 25. Mock Data

Tạo mock data có cấu trúc giống backend thật.

Ví dụ:

- User
- Workspace
- WorkspaceMember
- Page
- PageVersion
- Comment
- Notification
- File
- Favorite
- AIConversation

Không để mock data trực tiếp trong component.

---

## 26. Mock Service Layer

Tạo:

- `mockPageService`
- `mockWorkspaceService`
- `mockSearchService`
- `mockAIService`
- `mockCommentService`
- `mockNotificationService`

Các service trả về Promise để mô phỏng API.

Ví dụ:

```text
getPage(id)

createPage(data)

updatePage(id, data)

deletePage(id)

searchPages(query)

askAI(prompt)
```

Mục tiêu:

Frontend phải hoạt động giống như đang gọi Backend thật.

---

## 27. State Management

Sử dụng Zustand cho client state.

Ví dụ:

- `useWorkspaceStore`
- `useSidebarStore`
- `useEditorStore`
- `useUIStore`
- `useAIStore`

Không đưa toàn bộ state vào một store duy nhất.

Server/API state sau này dùng TanStack Query.

---

## 28. Form

Dùng:

- React Hook Form
- Zod

Cho:

- Login
- Register
- Workspace
- Page rename
- Settings
- Comments

---

## 29. Accessibility

Bắt buộc chú ý:

- Keyboard navigation
- Focus state
- `aria-label`
- Dialog accessibility
- Button accessibility
- Input labels
- Escape handling

Không chỉ làm giao diện đẹp.

---

## 30. Animation

Sử dụng Framer Motion cho:

- Sidebar
- Dialog
- Command palette
- AI panel
- Dropdown
- Toast
- Page transition

Animation phải nhanh và subtle.

Không lạm dụng animation.

---

## 31. Error Handling

Tạo:

- Error boundary
- Not found page
- Empty states
- Toast errors
- Form validation errors

---

## 32. Performance

Ngay từ đầu phải chú ý:

- Dynamic import cho editor
- Lazy loading
- Debounced search
- Memoization khi thực sự cần
- Không render lại toàn bộ page tree khi chỉnh sửa một node
- Virtualization nếu danh sách lớn
- Image optimization

Không lạm dụng `useMemo`/`useCallback`.

---

## 33. TypeScript

Tạo type rõ ràng:

- User
- Workspace
- WorkspaceMember
- Page
- PageNode
- Comment
- Notification
- AIMessage
- AIConversation
- File
- Permission
- Role

Không sử dụng `any`.

Không dùng type assertion nếu có thể tránh.

---

## 34. Mock Database Structure

Mock data phải mô phỏng database thực tế.

Ví dụ:

```ts
Page {
  id,
  workspaceId,
  parentId,
  title,
  icon,
  cover,
  content,
  isFavorite,
  isArchived,
  createdAt,
  updatedAt
}
```

Page có `parentId` để hỗ trợ nested pages.

---

## 35. UX Requirements

Các thao tác phải có feedback.

Ví dụ:

### Create Page

```text
Create Page
→ Optimistic UI
→ Loading indicator
→ Success
```

### Delete Page

```text
Delete
→ Confirmation
→ Optimistic removal
→ Undo toast
```

### Save

```text
Saving...
→ Saved
```

### AI

```text
Generating...
→ Streaming
→ Complete
```

---

## 36. Không được làm

Không:

- Tạo Backend
- Tạo Database thật
- Tạo API thật
- Gọi OpenAI thật
- Hard-code dữ liệu trong JSX
- Viết component vài nghìn dòng
- Dùng `any`
- Lặp lại UI code
- Copy toàn bộ Notion UI pixel-by-pixel
- Dùng quá nhiều dependency không cần thiết

---

## 37. Coding Standards

Code phải:

- Clean
- Readable
- Maintainable
- Strongly typed
- Componentized
- Reusable

Tên biến rõ nghĩa.

Không viết:

```text
data1
data2
temp
foo
bar
```

Không tạo abstraction quá sớm.

Ưu tiên code đơn giản trước.

---

## 38. Development Order

Không code toàn bộ project cùng lúc.

Thực hiện theo thứ tự:

### Phase 1

Project setup

↓

Layout

↓

Theme

↓

Sidebar

### Phase 2

Mock Workspace

↓

Page Tree

↓

Page CRUD

### Phase 3

Tiptap

↓

Editor

↓

Slash Command

### Phase 4

Search

↓

Command Palette

↓

Favorites

↓

Recent

↓

Trash

### Phase 5

Upload UI

↓

Comments

↓

Share

↓

Notifications

### Phase 6

AI UI

↓

AI Chat

↓

AI Selection Menu

↓

Mock Streaming

### Phase 7

Responsive

↓

Accessibility

↓

Loading

↓

Error Handling

### Phase 8

Performance

↓

Refactor

↓

Testing

---

## 39. Testing

Sau khi hoàn thành UI:

### Unit test

- Stores
- Utilities
- Search
- Page tree operations

### Component test

- Sidebar
- Editor toolbar
- Search
- AI panel

### E2E

```text
Login
→ Workspace
→ Create Page
→ Edit Page
→ Search
→ AI
→ Delete
→ Restore
```

---

## 40. Definition of Done

Frontend được xem là hoàn thành khi:

- Có thể đăng nhập bằng mock authentication.
- Có thể tạo Workspace.
- Có thể tạo Page.
- Có thể tạo nested Page không giới hạn.
- Có thể rename/delete/restore Page.
- Có Sidebar hoàn chỉnh.
- Có Rich Text Editor.
- Có Slash Command.
- Có Auto Save simulation.
- Có Search.
- Có Command Palette.
- Có Favorite.
- Có Recent Pages.
- Có Trash.
- Có Share UI.
- Có Comment UI.
- Có Notification UI.
- Có AI Assistant UI.
- Có AI streaming simulation.
- Có Dark/Light/System theme.
- Có Responsive UI.
- Có Loading/Empty/Error states.
- Có Keyboard shortcuts.
- Có Accessibility cơ bản.
- Có TypeScript strict.
- Không có `any` không cần thiết.
- Không có lỗi ESLint/TypeScript.
- Có README.

---

## 41. Chuẩn bị cho Backend

Mặc dù hiện tại chỉ làm Frontend, code phải được thiết kế để sau này dễ chuyển sang Backend.

Không viết:

```text
Component → trực tiếp sửa mock array
```

Thay vào đó:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
Mock Service
```

Sau này:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
API
```

Ví dụ:

```text
usePages()
    ↓
pageService.getPages()
    ↓
mockPageService
```

Sau này chỉ cần thay:

```text
mockPageService
    ↓
apiPageService
```

mà UI không thay đổi.

---

## 42. Cách làm việc

Không tạo tất cả file một lần.

Hãy làm theo từng Phase.

Sau mỗi Phase:

1. Kiểm tra TypeScript.
2. Kiểm tra ESLint.
3. Kiểm tra UI.
4. Kiểm tra responsive.
5. Refactor nếu cần.
6. Chỉ sau khi Phase hiện tại ổn định mới chuyển Phase tiếp theo.

Khi tôi yêu cầu một Phase cụ thể, chỉ tập trung implement Phase đó.

Không tự ý implement các Phase phía sau.

Nếu phát hiện một quyết định kiến trúc có thể ảnh hưởng đến Backend sau này, hãy ghi chú rõ lý do trước khi implement.

---

## 43. Mục tiêu cuối cùng

Tạo một Frontend có cảm giác như một sản phẩm SaaS thực tế, không phải một demo CRUD.

Project phải thể hiện được:

- Advanced React
- Next.js App Router
- TypeScript
- Complex state management
- Recursive UI
- Rich Text Editor
- Drag & Drop
- Search
- Command Palette
- Optimistic UI
- AI UX
- Responsive Design
- Accessibility
- Performance
- Clean Architecture

Sau khi hoàn thành Frontend, tôi sẽ xây dựng Backend riêng và thay thế Mock Service bằng API thật mà không cần viết lại phần UI.
