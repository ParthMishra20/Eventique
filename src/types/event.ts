export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
  creatorId?: string;
  category: string;
  createdAt?: string;
}

export interface ApiResponse {
  statusCode: number;
  headers: {
    [key: string]: string;
  };
  body: string;
}

export interface ApiResult<T> {
  response: Promise<ApiResponse>;
  body: T;
}

export interface EventsResponse {
  items: Event[];
}

export interface EventResponse {
  item: Event;
}