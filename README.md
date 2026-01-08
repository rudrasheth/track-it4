# TrackIT - Student & Mentor Management System

TrackIT is a comprehensive project management and academic tracking platform designed to bridge the gap between students and mentors. It facilitates task management, assignment submissions, grading, and communication in a unified interface.

## 🚀 Key Features

### 🎓 **Student Portal**
*   **Dashboard**: Overview of pending tasks, submission stats, and recent notices.
*   **Task Management**: View assigned tasks, track deadlines, and submit assignments.
*   **Kanban Board**: Visualize project progress.
*   **AI Assistant**: Built-in AI chat for academic assistance.
*   **Virtual Professor**: **[NEW]** Access interactive virtual lectures and classroom resources via an embedded virtual professor interface.
*   **Gradebook**: View grades and feedback. Note: Grades are hidden from the main view, prioritizing qualitative feedback.

### 👨‍🏫 **Mentor Portal**
*   **Dashboard**: Monitor student activity and group progress.
*   **Group Management**: Create and manage student groups.
*   **Task Assignment**: ongoing projects and individual tasks.
*   **Grading System**: 
    *   Comprehensive grading modal.
    *   **Rubrics**: Design and Clarity ratings.
    *   **Mandatory Feedback**: Feedback is now compulsory for all grades to ensure constructive criticism.
*   **Analytics**: Visual insights into student performance.

### 🛡️ **Admin Portal**
*   **User Management**: Oversee all registered users.
*   **System Settings**: Configure global application settings.

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), TypeScript
*   **Styling**: Tailwind CSS, shadcn/ui
*   **Backend / BaaS**: Supabase (PostgreSQL, Auth, Storage, Realtime)
*   **AI Integration**: Groq API (Llama 3)
*   **Deployment**: Vercel

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/rudrasheth/track-it4.git
    cd track-it4
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory with the following keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GROQ_API_KEY=your_groq_api_key
    ```
    *Refer to `SUPABASE_SETUP.md` and `GOOGLE_AUTH_SETUP.md` for detailed backend configuration.*

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 🔄 Recent Updates

*   **Virtual Professor**: Added a new Virtual Professor module for students (`/student/virtual-professor`).
*   **Grading Logic**:
    *   Students can no longer see raw numeric grades in the submission table, focusing them on feedback.
    *   Mentors are required to provide text feedback before saving a grade.
*   **UI/UX Improvements**: Enhanced sidebar navigation and responsive refinements.

## 📝 License

This project is licensed under the MIT License.
