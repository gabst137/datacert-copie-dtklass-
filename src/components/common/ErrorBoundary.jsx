import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console; could be extended to remote logging
    // Avoid throwing to keep UI usable
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto p-6 my-8 bg-red-50 border border-red-200 rounded-md text-red-800">
          <div className="font-semibold mb-2">A apărut o eroare în interfață.</div>
          <div className="text-sm mb-3">Reîmprospătați pagina sau reveniți la dashboard. Detaliile erorii au fost înregistrate în consolă.</div>
          <button
            className="px-4 py-2 text-sm rounded-md bg-white border border-red-300 hover:bg-red-100"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Încercați din nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
