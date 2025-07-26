
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Palette, 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  LogOut,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { cartItems } = useCart();
  const { t } = useLanguage();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();

  const { data: userProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Palette className="h-8 w-8 text-art-primary" />
            <span className="text-2xl font-bold font-heading">Art</span>
          </Link>

          {/* Language Selector */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-art-primary transition-colors"
            >
              {t('header.home')}
            </Link>
            <Link 
              to="/catalog" 
              className="text-gray-700 hover:text-art-primary transition-colors"
            >
              {t('header.catalog')}
            </Link>
            <Link 
              to="/catalog?category=featured" 
              className="text-gray-700 hover:text-art-primary transition-colors"
            >
              {t('header.featured')}
            </Link>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/cart")}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={userProfile?.avatar_url || ""} alt="Avatar" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {userProfile?.full_name || user.user_metadata?.full_name || t('header.user')}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    {t('header.myProfile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile?tab=downloads")}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('header.myDownloads')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('header.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  {t('header.signIn')}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  {t('header.createAccount')}
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-3">
            {/* Mobile Language Selector */}
            <div className="pb-3 border-b">
              <LanguageSelector />
            </div>
            
            <Link 
              to="/"
              className="block text-gray-700 hover:text-art-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('header.home')}
            </Link>
            <Link 
              to="/catalog"
              className="block text-gray-700 hover:text-art-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('header.catalog')}
            </Link>
            <Link 
              to="/catalog?category=featured"
              className="block text-gray-700 hover:text-art-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('header.featured')}
            </Link>
            {!user && (
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigate("/auth");
                    setIsMenuOpen(false);
                  }}
                >
                  {t('header.signIn')}
                </Button>
                <Button 
                  onClick={() => {
                    navigate("/auth");
                    setIsMenuOpen(false);
                  }}
                >
                  {t('header.createAccount')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
