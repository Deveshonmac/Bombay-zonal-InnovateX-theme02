import React, { useState } from 'react';
import {
  Users,
  Plus,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Eye,
  MapPin,
  Sparkles,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CommunityReport } from '../types';

export const CommunityFeed: React.FC = () => {
  const {
    communityReports,
    addCommunityReport,
    upvoteReport,
    currentCity,
    allCities,
    user,
  } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);

  // New report form state
  const [selectedCityId, setSelectedCityId] = useState<string>(currentCity.id);
  const [condition, setCondition] = useState<CommunityReport['reportedCondition']>('Stubble Burning Sighted');
  const [severity, setSeverity] = useState<CommunityReport['perceivedAQISeverity']>('Severe');
  const [description, setDescription] = useState<string>('');
  const [imagePlaceholder, setImagePlaceholder] = useState<string>('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80');

  const filteredReports = communityReports.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.reportedCondition.toLowerCase().includes(filterCategory.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const city = allCities.find((c) => c.id === selectedCityId) || currentCity;

    addCommunityReport({
      cityName: city.name,
      coordinates: city.coordinates,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      reputationScore: user.reputationPoints,
      reportedCondition: condition,
      perceivedAQISeverity: severity,
      description: description || 'Visual particulate haze and smoke odor observed at ground level.',
      isOfficialStationDiscrepancy: false,
      imageUrl: imagePlaceholder || undefined,
    });

    setIsSubmitOpen(false);
    setDescription('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Citizen Science & Ground-Truth Network
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time hyper-local field reports, visual smog verifications, and community sensor cross-validation.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
          id="submit-observation-modal-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Ground Observation</span>
        </button>
      </div>

      {/* Filter Tabs & Reputation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none">
          {['all', 'stubble', 'smoke', 'odor', 'haze'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
              }`}
            >
              {cat === 'all' ? 'All Field Reports' : `${cat} Incidents`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Your Contributor Karma: <strong className="text-zinc-900 dark:text-zinc-100">{user.reputationPoints} pts</strong> ({user.role})</span>
        </div>
      </div>

      {/* Reports Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header: User Info & Verification Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-xs">
                    {report.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{report.userName}</span>
                      {report.status === 'verified_by_moderator' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-500" title="Verified by Moderator" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {report.timestamp} • {report.cityName}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {report.userRole}
                </span>
              </div>

              {/* Observation Headline & Severity */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  {report.reportedCondition}
                </h3>
                <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase ${
                  report.perceivedAQISeverity === 'Hazardous' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                  report.perceivedAQISeverity === 'Severe' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {report.perceivedAQISeverity}
                </span>
              </div>

              {/* Photo Attachment if present */}
              {report.imageUrl && (
                <div className="rounded-xl overflow-hidden h-36 bg-zinc-100 dark:bg-zinc-800 mb-3">
                  <img
                    src={report.imageUrl}
                    alt="Ground truth photographic observation"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Narrative */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                "{report.description}"
              </p>
            </div>

            {/* Bottom Actions: Upvote */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Reputation: <strong className="text-zinc-700 dark:text-zinc-300">{report.reputationScore}/100</strong>
              </span>

              <button
                onClick={() => upvoteReport(report.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Confirm ({report.upvotes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Observation Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Submit Citizen Ground Observation
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Location / City:
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium"
                >
                  {allCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}, {c.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Condition:
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium"
                  >
                    <option value="Stubble Burning Sighted">🌾 Stubble Burning Sighted</option>
                    <option value="Heavy Smoke">🌫️ Heavy Smoke Plume</option>
                    <option value="Strong Chemical Odor">🧪 Strong Chemical Odor</option>
                    <option value="Noticeable Haze">🌆 Noticeable Haze</option>
                    <option value="Industrial Plume">🏭 Industrial Plume</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Severity:
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Hazardous">Hazardous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Field Description / Sensory Details:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe smoke color, eye burning sensation, wind direction, visible fire plumes, or nearest landmark..."
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Photo URL (Optional):
                </label>
                <input
                  type="text"
                  value={imagePlaceholder}
                  onChange={(e) => setImagePlaceholder(e.target.value)}
                  className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Publish Report (+15 Karma)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
