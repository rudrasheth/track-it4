export type UserRole = "student" | "mentor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  semester?: number;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignees: string[];
  dueDate: string;
  semester: number;
  groupId: string;
  files?: string[];
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  fileUrl: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isPinned: boolean;
  groupId?: string;
  fileUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  semester: number;
  students: string[];
  mentors: string[];
  progress: number;
  isOverdue: boolean;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  timestamp: string;
  fileUrl?: string;
}

export const mockUsers: User[] = [
  {
    id: "s1",
    name: "Rahul Sharma",
    email: "rahul.sharma@college.ac.in",
    role: "student",
    semester: 5,
    avatar: "RS"
  },
  {
    id: "s2",
    name: "Priya Patel",
    email: "priya.patel@college.ac.in",
    role: "student",
    semester: 5,
    avatar: "PP"
  },
  {
    id: "s3",
    name: "Amit Kumar",
    email: "amit.kumar@college.ac.in",
    role: "student",
    semester: 5,
    avatar: "AK"
  },
  {
    id: "s4",
    name: "Sneha Reddy",
    email: "sneha.reddy@college.ac.in",
    role: "student",
    semester: 5,
    avatar: "SR"
  },
  {
    id: "s5",
    name: "Vikram Singh",
    email: "vikram.singh@college.ac.in",
    role: "student",
    semester: 5,
    avatar: "VS"
  },
  {
    id: "m1",
    name: "Dr. Anjali Mehta",
    email: "anjali.mehta@college.ac.in",
    role: "mentor",
    avatar: "AM"
  },
  {
    id: "m2",
    name: "Prof. Rajesh Gupta",
    email: "rajesh.gupta@college.ac.in",
    role: "mentor",
    avatar: "RG"
  },
  {
    id: "a1",
    name: "Admin User",
    email: "admin@college.ac.in",
    role: "admin",
    avatar: "AD"
  }
];

export const mockGroups: Group[] = [
  {
    id: "g1",
    name: "AI Research Project",
    semester: 5,
    students: ["s1", "s2", "s3", "s4", "s5"],
    mentors: ["m1", "m2"],
    progress: 75,
    isOverdue: false
  },
  {
    id: "g2",
    name: "Web Development Team",
    semester: 4,
    students: ["s1", "s2", "s3"],
    mentors: ["m1"],
    progress: 45,
    isOverdue: true
  },
  {
    id: "g3",
    name: "Mobile App Innovation",
    semester: 6,
    students: ["s4", "s5"],
    mentors: ["m2"],
    progress: 90,
    isOverdue: false
  }
];

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Literature Review",
    description: "Complete comprehensive literature review on AI models",
    status: "done",
    assignees: ["s1", "s2"],
    dueDate: "2024-11-20",
    semester: 5,
    groupId: "g1"
  },
  {
    id: "t2",
    title: "Dataset Collection",
    description: "Gather and preprocess training data",
    status: "in-progress",
    assignees: ["s3", "s4"],
    dueDate: "2024-11-25",
    semester: 5,
    groupId: "g1"
  },
  {
    id: "t3",
    title: "Model Training",
    description: "Train and optimize the neural network",
    status: "todo",
    assignees: ["s5"],
    dueDate: "2024-12-01",
    semester: 5,
    groupId: "g1"
  },
  {
    id: "t4",
    title: "Frontend Development",
    description: "Build responsive React components",
    status: "review",
    assignees: ["s1", "s2"],
    dueDate: "2024-11-18",
    semester: 4,
    groupId: "g2",
    files: ["frontend-build.zip"]
  },
  {
    id: "t5",
    title: "API Integration",
    description: "Connect frontend with backend APIs",
    status: "todo",
    assignees: ["s3"],
    dueDate: "2024-11-22",
    semester: 4,
    groupId: "g2"
  },
  {
    id: "t6",
    title: "UI/UX Design",
    description: "Create mockups and design system",
    status: "done",
    assignees: ["s4", "s5"],
    dueDate: "2024-11-15",
    semester: 6,
    groupId: "g3"
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    taskId: "t1",
    studentId: "s1",
    fileUrl: "literature-review.pdf",
    submittedAt: "2024-11-19T10:30:00",
    grade: 92,
    feedback: "Excellent work! Comprehensive analysis."
  },
  {
    id: "sub2",
    taskId: "t4",
    studentId: "s1",
    fileUrl: "frontend-code.zip",
    submittedAt: "2024-11-17T15:45:00"
  },
  {
    id: "sub3",
    taskId: "t6",
    studentId: "s4",
    fileUrl: "design-mockups.fig",
    submittedAt: "2024-11-14T09:20:00",
    grade: 88,
    feedback: "Great design! Consider accessibility improvements."
  }
];

export const mockNotices: Notice[] = [
  {
    id: "n1",
    title: "Semester 5 Project Deadline Extended",
    content: "Due to technical issues, the final submission deadline has been extended to Dec 15.",
    createdAt: "2024-11-15T08:00:00",
    createdBy: "m1",
    isPinned: true
  },
  {
    id: "n2",
    title: "Weekly Team Meeting",
    content: "All groups must attend the weekly sync on Friday at 3 PM in Lab 204.",
    createdAt: "2024-11-14T12:00:00",
    createdBy: "m1",
    isPinned: true,
    groupId: "g1"
  },
  {
    id: "n3",
    title: "Code Review Guidelines",
    content: "Please follow the updated code review checklist attached.",
    createdAt: "2024-11-13T10:30:00",
    createdBy: "m2",
    isPinned: false,
    fileUrl: "checklist.pdf"
  },
  {
    id: "n4",
    title: "Mid-Semester Evaluation",
    content: "Individual presentations scheduled for next week. Check your group's slot.",
    createdAt: "2024-11-12T14:00:00",
    createdBy: "m1",
    isPinned: false
  },
  {
    id: "n5",
    title: "Lab Access Extended",
    content: "Lab will be open until 10 PM for the next two weeks.",
    createdAt: "2024-11-11T09:00:00",
    createdBy: "a1",
    isPinned: false
  }
];

export const mockMessages: Message[] = [
  {
    id: "msg1",
    groupId: "g1",
    senderId: "s1",
    content: "Hey team, I've uploaded the latest dataset. Please review!",
    timestamp: "2024-11-16T14:30:00"
  },
  {
    id: "msg2",
    groupId: "g1",
    senderId: "s2",
    content: "@Amit can you help with the preprocessing script?",
    timestamp: "2024-11-16T14:32:00"
  },
  {
    id: "msg3",
    groupId: "g1",
    senderId: "m1",
    content: "Great progress everyone! Let's schedule a review session.",
    timestamp: "2024-11-16T15:00:00"
  }
];
