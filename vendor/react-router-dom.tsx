"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

type LocationValue = { pathname: string; search: string };
type To = string | { pathname?: string; search?: string };
type NavigateOptions = { replace?: boolean };

type RouterValue = {
  location: LocationValue;
  navigate: (to: To, options?: NavigateOptions) => void;
  ready: boolean;
};

const fallbackLocation: LocationValue = { pathname: "/", search: "" };
const RouterContext = createContext<RouterValue>({
  location: fallbackLocation,
  navigate: () => undefined,
  ready: false,
});
const ParamsContext = createContext<Record<string, string>>({});

function readLocation(): LocationValue {
  if (typeof window === "undefined") return fallbackLocation;
  return { pathname: window.location.pathname || "/", search: window.location.search || "" };
}

function resolveTo(to: To, current: LocationValue): LocationValue {
  if (typeof to === "string") {
    const [pathname, query = ""] = to.split("?", 2);
    return { pathname: pathname || current.pathname, search: query ? `?${query}` : "" };
  }
  const search = to.search ?? "";
  return {
    pathname: to.pathname || current.pathname,
    search: search && !search.startsWith("?") ? `?${search}` : search,
  };
}

export function BrowserRouter({ children }: { children: ReactNode; future?: Record<string, boolean> }) {
  // Keep the first client render identical to SSR; hydrate the real URL after mount.
  const [location, setLocation] = useState<LocationValue>(fallbackLocation);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setLocation(readLocation());
    sync();
    setReady(true);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const value = useMemo<RouterValue>(() => ({
    location,
    ready,
    navigate: (to, options) => {
      const next = resolveTo(to, location);
      const href = `${next.pathname}${next.search}`;
      if (typeof window !== "undefined") {
        if (options?.replace) window.history.replaceState(null, "", href);
        else window.history.pushState(null, "", href);
      }
      setLocation(next);
    },
  }), [location, ready]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

type RouteProps = { path: string; element: ReactNode };

export function Route(_props: RouteProps) {
  return null;
}

function matchRoute(pattern: string, pathname: string) {
  if (pattern === "*") return { matched: true, params: {} };
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return { matched: false, params: {} };
  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];
    if (expected.startsWith(":")) params[expected.slice(1)] = decodeURIComponent(actual);
    else if (expected !== actual) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

export function Routes({ children }: { children: ReactNode }) {
  const { location, ready } = useContext(RouterContext);
  if (!ready) return null;
  const candidates = Children.toArray(children).filter(isValidElement) as ReactElement<RouteProps>[];
  for (const candidate of candidates) {
    const match = matchRoute(candidate.props.path, location.pathname);
    if (match.matched) {
      return <ParamsContext.Provider value={match.params}>{candidate.props.element}</ParamsContext.Provider>;
    }
  }
  return null;
}

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const target = resolveTo(to, location);
  useEffect(() => {
    if (target.pathname !== location.pathname || target.search !== location.search) {
      navigate(target, { replace });
    }
  }, [location.pathname, location.search, navigate, replace, target.pathname, target.search]);
  return null;
}

export function useLocation() {
  return useContext(RouterContext).location;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useContext(ParamsContext) as T;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams), options?: NavigateOptions) => void] {
  const { location, navigate } = useContext(RouterContext);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setSearchParams = (next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams), options?: NavigateOptions) => {
    const resolved = typeof next === "function" ? next(new URLSearchParams(searchParams)) : next;
    const value = resolved.toString();
    navigate({ pathname: location.pathname, search: value ? `?${value}` : "" }, options);
  };
  return [searchParams, setSearchParams];
}

type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: To };

export function NavLink({ to, onClick, children, ...props }: NavLinkProps) {
  const { location, navigate } = useContext(RouterContext);
  const resolved = resolveTo(to, location);
  return (
    <a
      {...props}
      href={`${resolved.pathname}${resolved.search}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          navigate(resolved);
        }
      }}
    >
      {children}
    </a>
  );
}
