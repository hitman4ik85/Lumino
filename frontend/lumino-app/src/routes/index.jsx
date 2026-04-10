import { Navigate, Route, Routes } from "react-router-dom";
import { PATHS } from "./paths.js";
import UserLayout from "../layouts/UserLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import { AdminGuard, DefaultRouteGuard, UserGuard } from "./guards.jsx";

import StartPage from "../pages/public/Start/StartPage.jsx";
import LoginPage from "../pages/public/Login/LoginPage.jsx";
import RegisterPage from "../pages/public/Register/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/public/ForgotPassword/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/public/ResetPassword/ResetPasswordPage.jsx";
import VerifyEmailPage from "../pages/public/VerifyEmail/VerifyEmailPage.jsx";
import OnboardingPage from "../pages/public/Onboarding/OnboardingPage.jsx";
import OnboardingLevelPage from "../pages/public/Onboarding/OnboardingLevel/OnboardingLevelPage.jsx";
import OnboardingLevelQuestionPage from "../pages/public/Onboarding/OnboardingLevelQuestion/OnboardingLevelQuestionPage.jsx";
import OnboardingLevelQuestionFlyPage from "../pages/public/Onboarding/OnboardingFly/OnboardingLevelQuestionFlyPage.jsx";
import OnboardingQuestionGoalPage from "../pages/public/Onboarding/OnboardingQuestionGoal/OnboardingQuestionGoalPage.jsx";
import OnboardingResultsPage from "../pages/public/Onboarding/OnboardingResults/OnboardingResultsPage.jsx";
import OnboardingDailyGoalPage from "../pages/public/Onboarding/OnboardingDailyGoal/OnboardingDailyGoalPage.jsx";
import OnboardingTrialPage from "../pages/public/Onboarding/OnboardingTrial/OnboardingTrialPage.jsx";
import OnboardingRunLessonPage from "../pages/public/Onboarding/OnboardingRunLesson/OnboardingRunLessonPage.jsx";
import OnboardingDemoLessonStubPage from "../pages/public/Onboarding/OnboardingDemoLessonStub/OnboardingDemoLessonStubPage.jsx";
import OnboardingPreCreateProfPage from "../pages/public/Onboarding/OnboardingPreCreateProf/OnboardingPreCreateProfPage.jsx";
import OnboardingCreateProfLaterPage from "../pages/public/Onboarding/OnboardingCreateProfLater/OnboardingCreateProfLaterPage.jsx";
import HomePage from "../pages/user/Home/HomePage.jsx";
import ProfilePage from "../pages/user/Profile/ProfilePage.jsx";
import AchievementsPage from "../pages/user/Achievements/AchievementsPage.jsx";
import VocabularyPage from "../pages/user/Vocabulary/VocabularyPage.jsx";
import LessonPage from "../pages/user/Lesson/LessonPage.jsx";
import LessonResultPage from "../pages/user/Result/LessonResultPage.jsx";
import ScenePage from "../pages/user/Scenes/ScenePage.jsx";
import SceneResultPage from "../pages/user/Scenes/Result/SceneResultPage.jsx";
import AdminPage from "../pages/admin/AdminPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={PATHS.start} element={<StartPage />} />
      <Route path={PATHS.login} element={<LoginPage />} />
      <Route path={PATHS.register} element={<RegisterPage />} />
      <Route path={PATHS.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={PATHS.resetPassword} element={<ResetPasswordPage />} />
      <Route path={PATHS.verifyEmail} element={<VerifyEmailPage />} />
      <Route path={PATHS.onboarding} element={<OnboardingPage />} />
      <Route path={PATHS.onboardingLevel} element={<OnboardingLevelPage />} />
      <Route path={PATHS.onboardingLevelQuestion} element={<OnboardingLevelQuestionPage />} />
      <Route path={PATHS.onboardingLevelQuestionFly} element={<OnboardingLevelQuestionFlyPage />} />
      <Route path={PATHS.onboardingQuestionGoal} element={<OnboardingQuestionGoalPage />} />
      <Route path={PATHS.onboardingResults} element={<OnboardingResultsPage />} />
      <Route path={PATHS.onboardingDailyGoal} element={<OnboardingDailyGoalPage />} />
      <Route path={PATHS.onboardingTrial} element={<OnboardingTrialPage />} />
      <Route path={PATHS.onboardingRunLesson} element={<OnboardingRunLessonPage />} />
      <Route path={PATHS.onboardingDemoLessonStub} element={<OnboardingDemoLessonStubPage />} />
      <Route path={PATHS.onboardingPreCreateProf} element={<OnboardingPreCreateProfPage />} />
      <Route path={PATHS.onboardingCreateProfLater} element={<OnboardingCreateProfLaterPage />} />

      <Route element={<UserLayout />}>
        <Route path={PATHS.home} element={<UserGuard><HomePage /></UserGuard>} />
        <Route path={PATHS.profile} element={<UserGuard><ProfilePage /></UserGuard>} />
        <Route path={PATHS.achievements} element={<UserGuard><AchievementsPage /></UserGuard>} />
        <Route path={PATHS.vocabulary} element={<UserGuard><VocabularyPage /></UserGuard>} />
        <Route path={PATHS.lesson()} element={<UserGuard><LessonPage /></UserGuard>} />
        <Route path={PATHS.lessonResult()} element={<UserGuard><LessonResultPage /></UserGuard>} />
        <Route path={PATHS.scene()} element={<UserGuard><ScenePage /></UserGuard>} />
        <Route path={PATHS.sceneResult()} element={<UserGuard><SceneResultPage /></UserGuard>} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path={PATHS.admin} element={<AdminGuard><AdminPage /></AdminGuard>} />
      </Route>

      <Route path="*" element={<DefaultRouteGuard />} />
    </Routes>
  );
}
