import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      signature_requests: {
        Row: {
          id: string;
          created_at: string;
          title: string | null;
          message: string | null;
          sender_email: string | null;
          document_url: string | null;
          status: string | null;
          'sign_-in_order': boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title?: string | null;
          message?: string | null;
          sender_email?: string | null;
          document_url?: string | null;
          status?: string | null;
          'sign_-in_order'?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string | null;
          message?: string | null;
          sender_email?: string | null;
          document_url?: string | null;
          status?: string | null;
          'sign_-in_order'?: boolean | null;
          updated_at?: string | null;
        };
      };
      recipients: {
        Row: {
          id: string;
          request_id: string | null;
          email: string | null;
          role: string | null;
          signing_order_index: number | null;
          signed_at: string | null;
          recipient_token: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          email?: string | null;
          role?: string | null;
          signing_order_index?: number | null;
          signed_at?: string | null;
          recipient_token?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          email?: string | null;
          role?: string | null;
          signing_order_index?: number | null;
          signed_at?: string | null;
          recipient_token?: string | null;
          status?: string | null;
        };
      };
      signature_fields: {
        Row: {
          id: string;
          request_id: string;
          recipient_id: string | null;
          type: string | null;
          page_number: number | null;
          x: number | null;
          y: number | null;
          width: number | null;
          height: number | null;
          value: string | null;
          signed_at: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          recipient_id?: string | null;
          type?: string | null;
          page_number?: number | null;
          x?: number | null;
          y?: number | null;
          width?: number | null;
          height?: number | null;
          value?: string | null;
          signed_at?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          recipient_id?: string | null;
          type?: string | null;
          page_number?: number | null;
          x?: number | null;
          y?: number | null;
          width?: number | null;
          height?: number | null;
          value?: string | null;
          signed_at?: string | null;
        };
      };
    };
  };
};