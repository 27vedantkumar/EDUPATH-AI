# EduPath AI — Architecture Diagrams (Mermaid)

## 1. System Architecture
```mermaid
flowchart TD
    User([Learner / Student])
    
    subgraph Frontend ["Frontend Web Application (Vite + React)"]
        Dash[Dashboard & Timeline]
        TutorUI[Grounded Tutor & Scoped Chat]
        AssessUI[Adaptive Quiz & Misconception Engine]
        GraphUI[Interactive Knowledge Graph]
        PlanUI[Adaptive Study Planner]
        FlashUI[SM-2 Flashcards & Revision]
        CodeUI[Sandboxed Coding Lab]
    end

    subgraph BackendAPI ["FastAPI REST Services"]
        RouterAuth[/api/auth/]
        RouterCourse[/api/courses/]
        RouterTutor[/api/tutor/]
        RouterAssess[/api/assessment/]
        RouterLearner[/api/learner/]
        RouterPlan[/api/planner/]
        RouterSandbox[/api/coding/]
    end

    subgraph IntelligenceCore ["Shared Intelligence Engine"]
        IngestionSvc[Multimodal Ingestion Pipeline]
        GraphSvc[Knowledge Graph Builder]
        RAGSvc[Hybrid Retriever: Vector + BM25 + Graph]
        GroundGate[Grounding & Refusal Gate]
        LearnerSvc[Learner Mastery Engine]
        MisconceptionSvc[Why Was I Wrong? Engine]
        ValidationSvc[Question Validation Pipeline]
    end

    subgraph StorageLayer ["Persistence Layer"]
        RelDB[(Relational DB: SQLite / Postgres)]
        VecStore[(Vector Index: Embeddings)]
        DocStore[(Document Storage: Uploads)]
    end

    User --> Frontend
    Frontend --> BackendAPI
    BackendAPI --> IntelligenceCore
    IntelligenceCore --> StorageLayer
```

## 2. Ingestion Pipeline
```mermaid
flowchart LR
    File[Course Material] --> Validate[Format & Security Check]
    Validate --> Route{File Type}
    
    Route -->|PDF| PDFParse[pypdf Page & Text Extractor]
    Route -->|PPTX| PPTXParse[Slide & Notes Extractor]
    Route -->|DOCX| DOCXParse[Heading & Section Extractor]
    Route -->|Video MP4| VideoParse[Timestamped Audio/Transcript Extractor]
    Route -->|Image| ImgParse[OCR & Visual Element Extractor]
    
    PDFParse --> Chunker[Semantic Chunking with Exact Source Location]
    PPTXParse --> Chunker
    DOCXParse --> Chunker
    VideoParse --> Chunker
    ImgParse --> Chunker
    
    Chunker --> Extractor[Topic, Concept & Prerequisite Extractor]
    Extractor --> Embed[Vector Embedding Generator]
    Extractor --> GraphBuild[Knowledge Graph Node & Edge Generator]
    
    Embed --> IndexVec[(Vector Store)]
    GraphBuild --> IndexGraph[(Knowledge Graph)]
    Chunker --> IndexUnits[(Knowledge Units DB)]
```

## 3. RAG Pipeline & Grounding Gate
```mermaid
flowchart TD
    Query[Student Query] --> Intent[Query & Concept Parser]
    Intent --> Retriever
    
    subgraph Retriever ["Hybrid Retrieval"]
        VecRet[Vector Semantic Search]
        KeyRet[BM25 Keyword Search]
        GraphRet[Knowledge Graph Traversal]
    end
    
    VecRet --> Fusion[Reciprocal Rank Fusion (RRF)]
    KeyRet --> Fusion
    GraphRet --> Fusion
    
    Fusion --> Rerank[Relevance Reranking]
    Rerank --> Gate{Grounding Gate\nEvidence Score >= 0.68?}
    
    Gate -->|No| Refuse["I couldn't find sufficient evidence in your course material."]
    Gate -->|Yes| GroundedGen[Grounded Response Synthesis]
    
    GroundedGen --> CiteVerify[Citation Verification: Page / Slide / Timestamp]
    CiteVerify --> FinalResponse[Grounded Answer + Verified Citations]
```

## 4. Learner Model & Mastery Dynamics
```mermaid
stateDiagram-v2
    [*] --> Novice: Diagnostic / Initial State (0.00 - 0.29)
    Novice --> Weak: Practice Attempt (0.30 - 0.49)
    Weak --> Developing: Targeted Remediation (0.50 - 0.69)
    Developing --> Proficient: Adaptive Quiz Pass (0.70 - 0.84)
    Proficient --> Mastered: Exam / Consistency (0.85 - 1.00)
    
    Mastered --> Proficient: Temporal Decay / Inactivity
    Proficient --> Developing: Repeated Incorrect Answers
    Developing --> Weak: Misconception Detected
```

## 5. Adaptive Assessment & Validation Pipeline
```mermaid
flowchart TD
    Req[Assessment Request: Topic + Mastery Level] --> Gen[Question Generator]
    Gen --> Solve[Independent Answer Solver]
    Solve --> Evidence[Source Evidence Cross-Check]
    Evidence --> Difficulty[Difficulty & Bloom Taxonomy Check]
    Difficulty --> Dupe[Duplicate Detector: History & Semantic Match]
    
    Dupe --> Decision{All Checks Passed?}
    Decision -->|No| Regenerate[Regenerate with Adjusted Constraints]
    Regenerate --> Gen
    Decision -->|Yes| Approve[Approve & Deliver to Student]
    
    Approve --> Response[Student Submits Answer]
    Response --> Outcome{Is Answer Correct?}
    Outcome -->|Yes| BoostMastery[Increment Mastery & XP]
    Outcome -->|No| Misconception[Trigger 'Why Was I Wrong?' Engine]
    
    Misconception --> Remediate[Deliver 2-Min Concept Remediation + Source Citation]
    Remediate --> Followup[Deliver Targeted Follow-Up Question]
```

## 6. Deployment Architecture
```mermaid
flowchart TB
    ClientBrowser[Web Browser / Client]
    
    subgraph DockerCompose ["Docker Compose Stack"]
        subgraph WebServer ["Web Container (Nginx / Vite)"]
            FrontendStatic[Static SPA Assets: HTML / JS / CSS]
        end
        
        subgraph APIContainer ["Backend Container (FastAPI + Uvicorn)"]
            FastAPIServer[FastAPI Application Server]
            WorkerPool[Background Ingestion Workers]
            SandboxRuntime[Isolated Code Runner Sandbox]
        end
        
        subgraph DataVolumes ["Persistent Named Volumes"]
            SQLVol[(SQLite DB / Postgres Volume)]
            VecVol[(Vector Storage Volume)]
            UploadVol[(Uploaded Materials Volume)]
        end
    end
    
    ClientBrowser -->|HTTP: Port 80/5173| WebServer
    WebServer -->|Reverse Proxy /api/| FastAPIServer
    FastAPIServer --> WorkerPool
    FastAPIServer --> SandboxRuntime
    FastAPIServer --> SQLVol
    FastAPIServer --> VecVol
    FastAPIServer --> UploadVol
```
