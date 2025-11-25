# GoiMaster Frontend 🇯🇵

![GoiMaster Banner](https://via.placeholder.com/1200x400?text=GoiMaster+Frontend)

> **Master Japanese Vocabulary with Style.**
> A modern, interactive, and beautiful vocabulary learning application built with React, Vite, and Tailwind CSS.

---

## 🚀 Features

-   **✨ Premium UI/UX**: Glassmorphism design, smooth animations (Framer Motion), and a vibrant color palette.
-   **📚 Vocabulary Management**: Organize words into groups and lessons.
-   **🧠 Interactive Quizzes**:
    -   Multiple modes: Kanji ↔ Meaning, Kanji ↔ Furigana.
    -   Customizable timers and auto-advance settings.
    -   **Detailed History**: Track every session and see exactly which words you missed.
-   **🃏 Flashcards**: Flip cards to memorize efficiently.
-   **📊 Progress Tracking**: Visual charts and study streaks to keep you motivated.
-   **🔐 Secure Auth**: JWT-based authentication with a Spring Boot backend.

---

## 🛠️ Tech Stack

-   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [clsx](https://github.com/lukeed/clsx)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **State/API**: Context API + Axios
-   **Backend Integration**: Spring Boot API

---

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components (Layout, Modal, etc.)
├── config/          # Configuration (API)
├── pages/           # Main application pages (Dashboard, Quiz, etc.)
├── services/        # API service layer
├── types.ts         # TypeScript definitions
├── App.tsx          # Main App component
├── AppContext.tsx   # Global State Management
└── index.tsx        # Entry point
```

---

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/goimaster-fe.git
    cd goimaster-fe
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_BASE_URL=http://localhost:8080/api
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 🎨 Customization

-   **Tailwind Config**: Check `tailwind.config.js` (or `index.html` script) to customize colors and fonts.
-   **API Endpoints**: Update `src/config/api.ts` if your backend URL changes.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 👨‍💻 Developer

Developed by **[NTT-DevFPT](https://github.com/NTT-DevFPT)**.

---

*Built with ❤️ for Japanese learners.*
