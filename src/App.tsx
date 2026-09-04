import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CompanyHomeView } from './views/CompanyHomeView';
import { LandingView } from './views/LandingView';
import { PricingView } from './views/PricingView';
import { CreateView } from './views/CreateView';
import { PreviewView } from './views/PreviewView';
import { PayView } from './views/PayView';
import { WatchView } from './views/WatchView';
import { AdminView } from './views/AdminView';
import { WeddingsLandingView } from './views/WeddingsLandingView';
import { WeddingsCreateView } from './views/WeddingsCreateView';
import { WeddingsSignupView } from './views/WeddingsSignupView';
import { WeddingsLoginView } from './views/WeddingsLoginView';
import { WeddingsDashboardView } from './views/WeddingsDashboardView';
import { WeddingsMineView } from './views/WeddingsMineView';
import { WeddingGuestView } from './views/WeddingGuestView';
import { BlogIndexView } from './views/BlogIndexView';
import { BlogPostView } from './views/BlogPostView';
import { WeddingInvitationViewer } from './components/WeddingInvitationViewer';
import { Experience, PlanTier, CoupleAccount } from './types';
import { DEFAULT_PAYMENT_REF } from './constants.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('free');
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null);
  const [paymentState, setPaymentState] = useState<{ reference: string; expId: string } | null>(null);
  const [watchSlug, setWatchSlug] = useState<string>('demo');
  const [blogSlug, setBlogSlug] = useState<string>('');
  const [weddingSlug, setWeddingSlug] = useState<string>('');
  const [guestSlug, setGuestSlug] = useState<string | null>(null);
  const [dashboardWeddingId, setDashboardWeddingId] = useState<string>('');
  const [currentCouple, setCurrentCouple] = useState<CoupleAccount | null>(null);

  // Check couple session on initial mount
  useEffect(() => {
    fetch('/api/weddings/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.couple) {
          setCurrentCouple(data.couple);
        }
      })
      .catch((err) => console.log('Couple auth check error:', err));
  }, []);

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

      if (path.startsWith('/w/wedding/')) {
        const sub = path.replace('/w/wedding/', '');
        const parts = sub.split('/');
        const wSlug = parts[0] || '';
        const gSlug = parts[1] || null;
        setWeddingSlug(wSlug);
        setGuestSlug(gSlug);
        setCurrentPath('/w/wedding/' + wSlug + (gSlug ? '/' + gSlug : ''));
      } else if (path.startsWith('/w/')) {
        const slug = path.replace('/w/', '') || 'demo';
        setWatchSlug(slug);
        setCurrentPath('/w/' + slug);
      } else if (path.startsWith('/blog/')) {
        const bSlug = path.replace('/blog/', '');
        setBlogSlug(bSlug);
        setCurrentPath('/blog/' + bSlug);
      } else if (path.startsWith('/weddings/dashboard/')) {
        const wId = path.replace('/weddings/dashboard/', '');
        setDashboardWeddingId(wId);
        setCurrentPath('/weddings/dashboard/' + wId);
      } else if (path === '/blog') {
        setCurrentPath('/blog');
      } else if (path === '/love-stories') {
        setCurrentPath('/love-stories');
      } else if (path === '/dev/wedding-spike') {
        setCurrentPath('/dev/wedding-spike');
      } else if (path === '/pricing') {
        setCurrentPath('/pricing');
      } else if (path === '/create') {
        setCurrentPath('/create');
      } else if (path === '/preview') {
        setCurrentPath('/preview');
      } else if (path === '/pay') {
        setCurrentPath('/pay');
      } else if (path === '/admin' || path === '/admin/demo-editor' || path.startsWith('/admin/')) {
        setCurrentPath('/admin');
      } else if (path === '/weddings') {
        setCurrentPath('/weddings');
      } else if (path === '/weddings/create') {
        setCurrentPath('/weddings/create');
      } else if (path === '/weddings/signup' || path === '/signup') {
        setCurrentPath('/signup');
      } else if (path === '/weddings/login' || path === '/login') {
        setCurrentPath('/login');
      } else if (path === '/weddings/mine') {
        setCurrentPath('/weddings/mine');
      } else {
        setCurrentPath('/');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Dynamically update canonical link tag for route changes
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
    const canonicalUrl = `https://amorah.xyz${cleanPath === '/' ? '/' : cleanPath}`;
    link.setAttribute('href', canonicalUrl);
  }, [currentPath]);

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

    if (urlObj.pathname.startsWith('/w/wedding/')) {
      const wSlug = urlObj.pathname.replace('/w/wedding/', '');
      setWeddingSlug(wSlug);
    } else if (urlObj.pathname.startsWith('/w/')) {
      const slug = urlObj.pathname.replace('/w/', '') || 'demo';
      setWatchSlug(slug);
    } else if (urlObj.pathname.startsWith('/blog/')) {
      const bSlug = urlObj.pathname.replace('/blog/', '');
      setBlogSlug(bSlug);
    } else if (urlObj.pathname.startsWith('/weddings/dashboard/')) {
      const wId = urlObj.pathname.replace('/weddings/dashboard/', '');
      setDashboardWeddingId(wId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Couple Logout handler
  const handleCoupleLogout = async () => {
    try {
      await fetch('/api/weddings/logout', { method: 'POST' });
      setCurrentCouple(null);
      navigate('/weddings');
    } catch (err) {
      console.error('Logout error:', err);
    }
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

  const isFullscreenView = currentPath.startsWith('/w/') || currentPath === '/dev/wedding-spike';

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFEFE] text-maroon font-sans antialiased">
      {/* Hide standard navbar on fullscreen recipient viewers */}
      {!isFullscreenView && (
        <Navbar currentPath={currentPath} onNavigate={navigate} />
      )}

      <main className="flex-1">
        {currentPath === '/' && <CompanyHomeView onNavigate={navigate} />}

        {currentPath === '/love-stories' && <LandingView onNavigate={navigate} />}

        {currentPath === '/dev/wedding-spike' && <WeddingInvitationViewer isSpike onNavigate={navigate} />}

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

        {currentPath.startsWith('/w/wedding/') && (
          <WeddingGuestView slug={weddingSlug} guestSlug={guestSlug} onNavigate={navigate} />
        )}

        {currentPath.startsWith('/w/') && !currentPath.startsWith('/w/wedding/') && (
          <WatchView slug={watchSlug} onNavigateToCreate={() => navigate('/pricing')} />
        )}

        {currentPath === '/admin' && (
          <AdminView />
        )}

        {(currentPath === '/weddings' || currentPath === '/wedding') && (
          <WeddingsLandingView onNavigate={navigate} currentCouple={currentCouple} onLogout={handleCoupleLogout} />
        )}

        {currentPath === '/weddings/mine' && (
          currentCouple ? (
            <WeddingsMineView onNavigate={navigate} currentCouple={currentCouple} onLogout={handleCoupleLogout} />
          ) : (
            <WeddingsLoginView onNavigate={navigate} onLoginSuccess={(c) => { setCurrentCouple(c); navigate('/weddings/mine'); }} />
          )
        )}

        {currentPath === '/weddings/create' && (
          currentCouple ? (
            <WeddingsCreateView onNavigate={navigate} currentCouple={currentCouple} />
          ) : (
            <WeddingsLoginView onNavigate={navigate} onLoginSuccess={(c) => { setCurrentCouple(c); navigate('/weddings/create'); }} />
          )
        )}

        {currentPath.startsWith('/weddings/dashboard/') && (
          currentCouple ? (
            <WeddingsDashboardView weddingId={dashboardWeddingId} onNavigate={navigate} currentCouple={currentCouple} />
          ) : (
            <WeddingsLoginView onNavigate={navigate} onLoginSuccess={(c) => { setCurrentCouple(c); navigate(`/weddings/dashboard/${dashboardWeddingId}`); }} />
          )
        )}

        {(currentPath === '/weddings/signup' || currentPath === '/signup') && (
          <WeddingsSignupView
            onNavigate={navigate}
            onSignupSuccess={(couple) => setCurrentCouple(couple)}
          />
        )}

        {(currentPath === '/weddings/login' || currentPath === '/login') && (
          <WeddingsLoginView
            onNavigate={navigate}
            onLoginSuccess={(couple) => setCurrentCouple(couple)}
          />
        )}

        {currentPath === '/blog' && (
          <BlogIndexView onNavigate={navigate} />
        )}

        {currentPath.startsWith('/blog/') && (
          <BlogPostView slug={blogSlug} onNavigate={navigate} />
        )}
      </main>

      {!isFullscreenView && <Footer onNavigate={navigate} />}
    </div>
  );
}





