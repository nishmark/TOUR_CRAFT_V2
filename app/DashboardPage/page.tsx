"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Image from "next/image";

interface UserData {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface TourStep {
  stepNumber: number;
  textContent: string;
  elementType: string;
  elementId: string;
  selector: string;
  url: string;
  clickable: string;
  MessageToUser?: string;
}

interface Tour {
  id: string;
  name: string;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  motherUrl: string;
  autoStart: boolean;
  steps: TourStep[];
}

export default function Page() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [toursLoading, setToursLoading] = useState(false);
  const [deletingTours, setDeletingTours] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user?.email) {
      setLoading(true);
      fetch("/api/user")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserData(data.user);
            // Fetch tours for this user
            setToursLoading(true);
            fetch(`/api/tours?userId=${data.user.id}`)
              .then((res) => res.json())
              .then((tourData) => {
                if (tourData.success) {
                  setTours(tourData.tours || []);
                }
              })
              .catch((error) => {
                console.error("Error fetching tours:", error);
              })
              .finally(() => {
                setToursLoading(false);
              });
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <Header />
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg">Not logged in</p>
        </div>
      </div>
    );
  }

  const { user } = session;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deleteTour = async (tourId: string, tourName: string) => {
    if (!confirm(`Are you sure you want to delete the tour "${tourName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingTours(prev => new Set(prev).add(tourId));

    try {
      const response = await fetch(`/api/tours?id=${tourId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the tour from the local state
        setTours(prev => prev.filter(tour => tour.id !== tourId));
        alert(`Tour "${tourName}" has been deleted successfully.`);
      } else {
        const error = await response.json();
        alert(`Failed to delete tour: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert('An error occurred while deleting the tour. Please try again.');
    } finally {
      setDeletingTours(prev => {
        const newSet = new Set(prev);
        newSet.delete(tourId);
        return newSet;
      });
    }
  };

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {/* User Info Card */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <Image
                  className="h-20 w-20 rounded-full"
                  src={user?.image || "/Logo.jpeg"}
                  alt="Profile"
                  width={80}
                  height={80}
                />
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name || "User"}!
                  </h2>
                  <p className="text-gray-600">
                    Email: {user?.email || "No email provided"}
                  </p>
                  <p className="text-gray-600">
                    User ID:{" "}
                    {userData?.id ||
                      (loading ? "Loading..." : "No ID available")}
                  </p>
                </div>
              </div>
            </div>

            {/* Tours Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                My Tours
              </h3>

              {toursLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-lg text-gray-600">Loading tours...</p>
                </div>
              ) : tours.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    You haven&apos;t created any tours yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start by crafting your first tour!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {tour.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Created: {formatDate(tour.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total Steps: {tour.totalSteps}
                          </p>
                          <p className="text-sm text-gray-600">
                            URL: {tour.motherUrl}
                          </p>
                          <p className="text-sm text-gray-600">
                            {tour.autoStart ? (
                              <span className="inline-flex items-center text-green-600">
                                🚀 Auto-start enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-gray-500">
                                🎯 Manual trigger required
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => deleteTour(tour.id, tour.name)}
                            disabled={deletingTours.has(tour.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {deletingTours.has(tour.id) ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              <>
                                🗑️ Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Tour Steps */}
                      <div className="mt-4">
                        <h5 className="text-md font-medium text-gray-900 mb-3">
                          Tour Steps:
                        </h5>
                        <div className="space-y-4">
                          {tour.steps &&
                            Array.isArray(tour.steps) &&
                            tour.steps.map((step, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-center mb-3">
                                  <span className="font-bold text-lg text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                    Step {step.stepNumber}
                                  </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Text In This Element:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {step.textContent || "No text content"}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Element Type:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {step.elementType}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Element ID:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {step.elementId || "No ID"}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Selector:
                                    </span>
                                    <span className="text-gray-600 flex-1 font-mono text-xs">
                                      {step.selector}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      URL:
                                    </span>
                                    <span className="text-gray-600 flex-1 text-xs break-all">
                                      {step.url}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Clickable:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {step.clickable || "No"}
                                    </span>
                                  </div>
                                  <div className="flex">
                                    <span className="font-medium text-gray-700 w-32">
                                      Message To User:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {step.MessageToUser ? (
                                        <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200">
                                          {step.MessageToUser}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          No message set
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/CraftTourPage"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Craft A Tour
                </a>
                <a
                  href="/LinkTourCraftPage"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Link TourCraft
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
