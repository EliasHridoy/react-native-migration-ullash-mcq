export interface Board {
  id: string;
  name: string;
  category: string; // 'SSC', 'HSC', 'BCS', 'Admission', 'Job'
  createdAt: string | null;
}
