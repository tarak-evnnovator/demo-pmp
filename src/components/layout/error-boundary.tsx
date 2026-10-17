import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="state" role="alert">
          <h3>This page could not be displayed</h3>
          <p>Please reload and try again.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Reload
          </Button>
        </div>
      );
    return this.props.children;
  }
}
