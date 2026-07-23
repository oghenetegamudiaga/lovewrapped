import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingView } from './views/LandingView';
import { PricingView } from './views/PricingView';
import { CreateView } from './views/CreateView';
import { PreviewView } from './views/PreviewView';
import { PayView } from './views/PayView';
import { WatchView } from './views/WatchView';
import { AdminView } from './views/AdminView';
import { Experience, PlanTier } from './types';
import { DEFAULT_PAYMENT_REF } from './constants.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('free');
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null);
  const [paymentState, setPaymentState] = useState<{ reference: string; expId: string } | null>(null);
  const [watchSlug, setWatchSlug] = useState<string>('demo');

  // Parse path on initial load & popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const fullPath = window.location.pathname + window.location.search;
      const urlObj = new URL(fullPath, window.location.origin);
      const path = urlObj.pathname;
      const planParam = urlObj.searchParams.get('plan') as PlanTier;

      if (planParam && (planParam === 'free' || planParam === 'paid' || planParam === 'custom')) {
        setSelectedPlan(planParam);
      }

      if (path.startsWith('/w/')) {
        const slug = path.replace('/w/', '') || 'demo';
        setWatchSlug(slug);
        setCurrentPath('/w/' + slug);
      } else if (path === '/pricing') {
        setCurrentPath('/pricing');
      } else if (path === '/create') {
        setCurrentPath('/create');
      } else if (path === '/preview') {
        setCurrentPath('/preview');
      } else if (path === '/pay') {
        setCurrentPath('/pay');
      } else if (path === '/admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Safe navigation helper that syncs window history
  const navigate = (path: string) => {
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
    const urlObj = new URL(path, window.location.origin);
    const planParam = urlObj.searchParams.get('plan') as PlanTier;
    if (planParam && (planParam === 'free' || planParam === 'paid' || planParam === 'custom')) {
      setSelectedPlan(planParam);
    }
    setCurrentPath(urlObj.pathname);

    if (urlObj.pathname.startsWith('/w/')) {
      const slug = urlObj.pathname.replace('/w/', '') || 'demo';
      setWatchSlug(slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Plan Selection handler
  const handleSelectPlan = (plan: PlanTier) => {
    setSelectedPlan(plan);
    navigate('/create');
  };

  // Experience creation completion -> route to preview
  const handleExperienceCreated = (exp: Experience) => {
    setCurrentExperience(exp);
    navigate('/preview');
  };

  // Proceed to Paystack payment
  const handleProceedToPayment = (authUrl: string, reference: string, expId: string) => {
    setPaymentState({ reference, expId });
    navigate('/pay');
  };

  // Share free story instantly
  const handleShareFree = (exp: Experience) => {
    navigate(`/w/${exp.slug}?share=true`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-rose-50/30 text-rose-950 font-sans antialiased">
      {/* Hide standard navbar on fullscreen recipient viewer /w/[slug] */}
      {!currentPath.startsWith('/w/') && (
        <Navbar currentPath={currentPath} onNavigate={navigate} />
      )}

      <main className="flex-1">
        {currentPath === '/' && <LandingView onNavigate={navigate} />}

        {currentPath === '/pricing' && (
          <PricingView onSelectPlan={handleSelectPlan} />
        )}

        {currentPath === '/create' && (
          <CreateView
            selectedPlan={selectedPlan}
            onChangePlan={(p) => setSelectedPlan(p)}
            onExperienceCreated={handleExperienceCreated}
          />
        )}

        {currentPath === '/preview' && currentExperience && (
          <PreviewView
            experience={currentExperience}
            onEditStory={() => navigate('/create')}
            onShareFree={handleShareFree}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

        {currentPath === '/pay' && (
          <PayView
            reference={paymentState?.reference || DEFAULT_PAYMENT_REF}
            experienceId={paymentState?.expId || currentExperience?.id || 'demo'}
            onViewExperience={(slug) => navigate(`/w/${slug}`)}
          />
        )}

        {currentPath.startsWith('/w/') && (
          <WatchView slug={watchSlug} onNavigateToCreate={() => navigate('/pricing')} />
        )}

        {currentPath === '/admin' && (
          <AdminView onPreviewExperience={(slug) => navigate(`/w/${slug}`)} />
        )}
      </main>

      {!currentPath.startsWith('/w/') && <Footer onNavigate={navigate} />}
    </div>
  );
}
