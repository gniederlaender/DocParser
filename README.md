# Document Parser

An AI-powered web application that extracts structured data from various document types using Large Language Models (LLMs). Upload documents like invoices, receipts, business cards, and resumes to get clean, structured JSON data.

## 🚀 Features

- **Multiple Document Types**: Support for invoices, receipts, business cards, and resumes
- **AI-Powered Extraction**: Uses OpenAI GPT-4 for intelligent data extraction
- **Drag & Drop Upload**: Intuitive file upload interface
- **Real-time Processing**: Live progress updates during document processing
- **JSON Export**: Download extracted data as JSON files
- **Responsive Design**: Works on desktop and mobile devices
- **Type-Safe**: Built with TypeScript for reliability
- **Extensible**: Easy to add new document types and extraction rules

## 🏗️ Architecture

```
document-parser/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript type definitions
│   │   ├── config/          # Configuration files
│   │   └── utils/           # Utility functions
│   └── uploads/             # Temporary file storage
├── frontend/                # React web application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
└── docs/                    # Documentation
```

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **OpenAI API Key**: Required for document processing

## 🛠️ Installation

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd document-parser
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Copy the backend environment template:
   ```bash
   cp backend/env.example backend/.env
   ```

   Edit `backend/.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run build
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.1

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Security Configuration
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Document Types

Document types are configured in `backend/src/config/documentTypes.json`:

```json
{
  "documentTypes": [
    {
      "id": "invoice",
      "name": "Invoice",
      "description": "Extract data from invoices",
      "supportedFormats": ["pdf", "png", "jpg", "jpeg"],
      "maxFileSize": 10485760,
      "promptTemplate": "invoice_prompt.txt"
    }
  ]
}
```

## 🚀 Usage

1. **Open the application** in your web browser
2. **Select a document type** (Invoice, Receipt, Business Card, or Resume)
3. **Upload your document** by dragging and dropping or clicking to browse
4. **Click "Extract Data"** to process the document
5. **Review the results** and download the JSON data

### API Usage

The backend provides a REST API for programmatic access:

```bash
# Upload and process a document
curl -X POST http://localhost:3001/api/upload \
  -F "file=@document.pdf" \
  -F "documentType=invoice"

# Get available document types
curl http://localhost:3001/api/document-types
```

## 📁 Supported Document Types

| Type | Formats | Description |
|------|---------|-------------|
| **Invoice** | PDF, PNG, JPG, JPEG | Extracts vendor info, amounts, line items |
| **Receipt** | PDF, PNG, JPG, JPEG | Extracts merchant info, transaction details |
| **Business Card** | PNG, JPG, JPEG | Extracts contact information |
| **Resume/CV** | PDF, DOCX | Extracts personal and professional information |

## 🔒 Security

- File type validation and size limits
- Rate limiting to prevent abuse
- Secure file handling with temporary storage
- CORS protection
- Input sanitization
- Automatic cleanup of uploaded files

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run linting
npm run lint
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run prod
```

### Docker Deployment
See `docs/Deployment_With_Docker.md` for containerized deployment.

### Server Deployment
See `docs/Deployment_Without_Docker.md` for direct server deployment.

## 🔧 Adding New Document Types

1. **Add to configuration** in `backend/src/config/documentTypes.json`
2. **Create prompt template** in `backend/src/config/prompts/`
3. **Update types** in `backend/src/types/index.ts`
4. **Update UI components** to display the new type

Example prompt template (`backend/src/config/prompts/new_type_prompt.txt`):
```
You are a document parsing assistant. Extract the following information from this [DOCUMENT_TYPE]:

REQUIRED FIELDS:
- field1: Description of field1
- field2: Description of field2

OPTIONAL FIELDS:
- optionalField: Description of optional field

Return the data as a valid JSON object.
```

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAI API Key not found"**
   - Ensure `OPENAI_API_KEY` is set in `backend/.env`
   - Check that the API key is valid and has credits

2. **"Cannot connect to backend"**
   - Ensure backend is running on port 3001
   - Check CORS configuration
   - Verify network connectivity

3. **"File upload failed"**
   - Check file size limits
   - Verify supported file formats
   - Ensure upload directory permissions

4. **"Processing failed"**
   - Check OpenAI API status
   - Verify document quality and readability
   - Review API rate limits

### Logs

```bash
# Backend logs
cd backend && npm run dev

# Frontend console
# Open browser developer tools (F12)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4 API
- React and Express communities
- All contributors and users

## 📞 Support

For support, email support@documentparser.com or create an issue in the repository.

---

**Made with ❤️ using React, Node.js, and AI**
