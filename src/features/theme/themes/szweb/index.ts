import "./styles/base.css";
import "./styles/indexes.css";
import "./styles/account.css";
import "./styles/reading.css";
import "./styles/polish.css";
import "./styles/editorial.css";
import "./styles/motion.css";
import "./styles/fold.css";
import "./styles/folio.css";
import "./styles/refinement.css";
import "./styles/book-cover.css";
import { lazy } from "react";
import Toaster from "@/components/ui/toaster";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { config } from "./config";
import { AuthLayout, PublicLayout, UserLayout } from "./layouts/shell";
import { AboutPage } from "./pages/about";
import { ArchivePage } from "./pages/archive";
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages/auth";
import { DirectoryPage } from "./pages/directory";
import { ErrorPage, NotFoundPage } from "./pages/error";
import { FriendLinksPage, FriendLinksPageSkeleton } from "./pages/friend-links";
import { HomePage, HomePageSkeleton } from "./pages/home";
import { PostPageSkeleton } from "./pages/post-skeleton";
import { PostsPage, PostsPageSkeleton } from "./pages/posts";
import { ProfilePage } from "./pages/profile";
import { ProjectPage, ProjectsPage } from "./pages/projects";
import { SearchPage } from "./pages/search";
import { SubmitFriendLinkPage } from "./pages/submit-friend-link";
import { TagsPage } from "./pages/tags";

// The article renderer and rich comment editor load only on a reading route.
const PostPage = lazy(() =>
  import("./pages/post").then((module) => ({ default: module.PostPage })),
);

export default {
  config,
  PublicLayout,
  UserLayout,
  AuthLayout,
  HomePage,
  HomePageSkeleton,
  PostsPage,
  PostsPageSkeleton,
  PostPage,
  PostPageSkeleton,
  SearchPage,
  ArchivePage,
  DirectoryPage,
  TagsPage,
  ProjectsPage,
  ProjectPage,
  AboutPage,
  ErrorPage,
  NotFoundPage,
  FriendLinksPage,
  FriendLinksPageSkeleton,
  SubmitFriendLinkPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ProfilePage,
  Toaster,
} satisfies ThemeComponents;
