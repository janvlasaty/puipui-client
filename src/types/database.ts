export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          id: string
          isbn: string
          name: string
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn: string
          name: string
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string
          name?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          code: string
          created_at: string
          expire_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expire_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expire_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string
          edited_at: string
          id: string
          room_id: string
          topic_id: string | null
          type: Database["public"]["Enums"]["type_message_type"]
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          content: string
          created_at?: string
          edited_at?: string
          id?: string
          room_id: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["type_message_type"]
          user_id: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string
          edited_at?: string
          id?: string
          room_id?: string
          topic_id?: string | null
          type?: Database["public"]["Enums"]["type_message_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      pois: {
        Row: {
          category: Database["public"]["Enums"]["type_poi_category"]
          created_at: string
          id: string
          label: string
          latitude: number
          longitude: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["type_poi_category"]
          created_at?: string
          id?: string
          label: string
          latitude: number
          longitude: number
        }
        Update: {
          category?: Database["public"]["Enums"]["type_poi_category"]
          created_at?: string
          id?: string
          label?: string
          latitude?: number
          longitude?: number
        }
        Relationships: []
      }
      pois_reviews: {
        Row: {
          created_at: string
          emoji: Database["public"]["Enums"]["type_emoji_char"]
          id: string
          note: string
          poi_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: Database["public"]["Enums"]["type_emoji_char"]
          id?: string
          note: string
          poi_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: Database["public"]["Enums"]["type_emoji_char"]
          id?: string
          note?: string
          poi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pois_reviews_poi_id_fkey"
            columns: ["poi_id"]
            isOneToOne: false
            referencedRelation: "pois"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          name: string
          surname: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id?: string
          name: string
          surname: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
          surname?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          is_direct: boolean
          label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_direct?: boolean
          label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_direct?: boolean
          label?: string | null
        }
        Relationships: []
      }
      rooms_users: {
        Row: {
          created_at: string
          last_read_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_read_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_read_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_users_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_users_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label: string
          room_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label: string
          room_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vibes: {
        Row: {
          archived_at: string | null
          created_at: string
          emoji: Database["public"]["Enums"]["type_emoji_char"]
          emotion: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          emoji: Database["public"]["Enums"]["type_emoji_char"]
          emotion?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          emoji?: Database["public"]["Enums"]["type_emoji_char"]
          emotion?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vibes_books: {
        Row: {
          book_id: string
          id: string
          vibe_id: string
        }
        Insert: {
          book_id: string
          id?: string
          vibe_id: string
        }
        Update: {
          book_id?: string
          id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibes_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibes_books_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: true
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_accept_invitation: { Args: { p_code: string }; Returns: string }
      fn_create_room: { Args: { p_label: string }; Returns: string }
      get_user_in_room: { Args: { p_room_id: string }; Returns: boolean }
    }
    Enums: {
      type_emoji_char:
        | "😍"
        | "🥰"
        | "🤩"
        | "😂"
        | "🤗"
        | "😢"
        | "😔"
        | "😠"
        | "🤮"
        | "❤️"
        | "💔"
        | "👍"
        | "👎"
      type_message_type:
        | "text"
        | "link"
        | "poll"
        | "expense"
        | "image"
        | "location"
      type_poi_category: "Coffee" | "Food" | "Drink" | "Bakery" | "Stay" | "Gem"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      type_emoji_char: [
        "😍",
        "🥰",
        "🤩",
        "😂",
        "🤗",
        "😢",
        "😔",
        "😠",
        "🤮",
        "❤️",
        "💔",
        "👍",
        "👎",
      ],
      type_message_type: [
        "text",
        "link",
        "poll",
        "expense",
        "image",
        "location",
      ],
      type_poi_category: ["Coffee", "Food", "Drink", "Bakery", "Stay", "Gem"],
    },
  },
} as const
