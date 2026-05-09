export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      shopping_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          budget: number;
          status: Database["public"]["Enums"]["shopping_list_status"];
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          budget: number;
          status?: Database["public"]["Enums"]["shopping_list_status"];
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          budget?: number;
          status?: Database["public"]["Enums"]["shopping_list_status"];
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          barcode: string | null;
          unit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          barcode?: string | null;
          unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string | null;
          barcode?: string | null;
          unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      shopping_list_items: {
        Row: {
          id: string;
          user_id: string;
          shopping_list_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          bought: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shopping_list_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          bought?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shopping_list_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          bought?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_owner_fk";
            columns: ["shopping_list_id", "user_id"];
            referencedRelation: "shopping_lists";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "shopping_list_items_product_owner_fk";
            columns: ["product_id", "user_id"];
            referencedRelation: "products";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      price_history: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          shopping_list_id: string;
          shopping_list_item_id: string | null;
          price: number;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          shopping_list_id: string;
          shopping_list_item_id?: string | null;
          price: number;
          recorded_at?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "price_history_product_owner_fk";
            columns: ["product_id", "user_id"];
            referencedRelation: "products";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "price_history_list_owner_fk";
            columns: ["shopping_list_id", "user_id"];
            referencedRelation: "shopping_lists";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      user_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: Database["public"]["Enums"]["user_event_type"];
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: Database["public"]["Enums"]["user_event_type"];
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      shopping_list_status: "active" | "completed" | "archived";
      user_event_type:
        | "SHOPPING_LIST_CREATED"
        | "SHOPPING_LIST_COMPLETED"
        | "PRODUCT_CREATED"
        | "ITEM_ADDED"
        | "ITEM_UPDATED"
        | "ITEM_REMOVED"
        | "ITEM_CHECKED"
        | "PRICE_RECORDED";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<TTableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TTableName]["Row"];

export type TablesInsert<TTableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TTableName]["Insert"];

export type TablesUpdate<TTableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TTableName]["Update"];
