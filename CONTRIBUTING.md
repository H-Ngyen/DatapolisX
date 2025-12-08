# Contributing to DatapolisX

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to DatapolisX. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🛠 Development Setup

DatapolisX is a monorepo containing both Python backend services and a Next.js frontend. You can choose to work on one or both.

### 1. Web Application (Next.js)

1.  Navigate to the web directory:
    ```bash
    cd web
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Update .env with your local DB credentials
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

### 2. Analysis Workers (Python)

Each worker (`camera-ingest`, `image-process`, `image-predict`) is an independent Python service.

1.  Navigate to the specific worker directory (e.g., `AnalysisWorker/image-process`).
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

##  workflow

1.  **Fork** the repo on GitHub.
2.  **Clone** the project to your own machine.
3.  **Create a branch** for your work (`git checkout -b feature/amazing-feature`).
4.  **Commit** changes to your branch.
5.  **Push** your work back up to your fork.
6.  Submit a **Pull Request** so that we can review your changes.

## 🎨 Coding Standards

*   **TypeScript/JavaScript:** We use ESLint. Please ensure `npm run lint` passes before pushing.
*   **Python:** Follow PEP 8 guidelines.
*   **Commits:** Use clear and descriptive commit messages.

## 🐛 Reporting Bugs

Bugs are tracked as GitHub issues. When creating an issue, explain the problem and include additional details to help maintainers reproduce the problem:

*   Use a clear and descriptive title.
*   Describe the exact steps which reproduce the problem.
*   Provide specific examples to demonstrate the steps.

## 📝 License

By contributing, you agree that your contributions will be licensed under its MIT License.