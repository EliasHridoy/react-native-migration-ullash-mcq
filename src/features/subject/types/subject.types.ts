export interface Subject {
  id: string;
  name: string;
  boardId: string;
  createdAt: string | null;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  createdAt: string | null;
}

export interface Topic {
  id: string;
  name: string;
  chapterId: string;
  createdAt: string | null;
}
