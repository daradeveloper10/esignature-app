# eSignature Request - Microsoft Word Integration

A modern eSignature application built with React, TypeScript, and Supabase that allows users to create and send signature requests directly from Microsoft Word.

## Features

- 📝 Create signature requests with custom documents
- 👥 Add multiple recipients with email notifications
- ✍️ Electronic signature fields (signature, initials, date)
- 📧 Automated email notifications with signing links
- 🔄 Sequential or parallel signing workflows
- 📱 Responsive design for all devices
- 🔒 Secure document handling with Supabase

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Email**: SendGrid API
- **Deployment**: Netlify
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- SendGrid account (for email functionality)
- Netlify account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd esignature-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PUBLIC_APP_URL=http://localhost:5173
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Database Setup

The application uses Supabase with the following tables:
- `signature_requests` - Main signature request data
- `recipients` - Recipient information and signing status
- `signature_fields` - Signature field positions and values

Database migrations are located in `supabase/migrations/`.

### Email Configuration

Set up SendGrid in your Supabase Edge Functions:

1. Go to your Supabase dashboard
2. Navigate to Edge Functions → Secrets
3. Add these environment variables:
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `FROM_EMAIL`: Your verified sender email
   - `FROM_NAME`: Your sender name

## Deployment

### Automatic Deployment with Netlify + GitHub

1. **Push your code to GitHub**
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Configure Environment Variables** in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PUBLIC_APP_URL` (your Netlify URL)

4. **Deploy**: Every push to your main branch will automatically deploy!

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DraggableRecipient.tsx
│   ├── EmailTestButton.tsx
│   ├── LoadingModal.tsx
│   └── RecipientList.tsx
├── utils/              # Utility functions
│   ├── emailService.ts
│   ├── pdfGenerator.ts
│   └── supabase.ts
├── App.tsx             # Main application component
├── SigningPage.tsx     # Document signing interface
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge Functions
│   ├── send-email/
│   └── test-email/
└── migrations/         # Database migrations
```

## Key Features Explained

### Document Creation
- Rich text document preview
- Drag-and-drop signature field placement
- Multiple field types (signature, initials, date)

### Recipient Management
- Multiple email addresses per recipient
- Drag-and-drop signing order
- Role-based permissions

### Email Notifications
- Professional HTML email templates
- Secure signing links with tokens
- PDF document attachments

### Signing Experience
- Interactive signature canvas
- Real-time field completion tracking
- Mobile-responsive interface

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or create an issue in the GitHub repository.