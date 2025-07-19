import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, Shield, Zap } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Tovu</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/chat">Chat</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <MessageCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Connect & Chat
              <span className="block text-primary">Seamlessly</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience real-time messaging like never before. Join
              conversations, share moments, and stay connected with friends and
              colleagues.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="xl"
              className="text-xl font-semibold px-8 py-3"
              asChild
            >
              <Link to="/chat">Start Chatting</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="text-xl px-8 py-3 bg-transparent font-semibold"
              asChild
            >
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Real-time messaging with instant delivery and seamless
                  synchronization across all devices.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Video Calls</h3>
                <p className="text-muted-foreground">
                  High-quality peer-to-peer video calling powered by WebRTC
                  technology for crystal clear conversations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Supabase Backend</h3>
                <p className="text-muted-foreground">
                  Reliable and scalable backend infrastructure with real-time
                  database and authentication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Ready to start chatting?
          </h2>
          <p className="text-xl text-primary-foreground mb-8">
            Join thousands of users who trust Tovu for their daily
            conversations.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-3"
            asChild
          >
            <Link to="/register">Sign Up Now</Link>
          </Button>
        </div>
      </section>

      <footer className="bg-background text-secondary-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MessageCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">Tovu</span>
            </div>
            <div className="flex space-x-6">
              <Link
                to="/chat"
                className="hover:text-primary/80 transition-colors"
              >
                Chat
              </Link>
              <Link
                to="/login"
                className="hover:text-primary/80 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-primary/80 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Tovu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
