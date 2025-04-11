import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Twitter, Facebook, Linkedin, Share2, Instagram, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  withTooltip?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "default" | "ghost";
  platforms?: ("twitter" | "facebook" | "linkedin" | "instagram" | "copy")[];
}

export function SocialShare({
  title,
  text,
  url = window.location.href,
  className = "",
  withTooltip = true,
  showLabel = false,
  size = "md",
  variant = "outline",
  platforms = ["twitter", "facebook", "linkedin", "instagram", "copy"],
}: SocialShareProps) {
  const { toast } = useToast();
  
  // Get icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-4 w-4";
      case "lg": return "h-6 w-6";
      default: return "h-5 w-5";
    }
  };
  
  // Get button size based on the size prop
  const getButtonSize = () => {
    switch (size) {
      case "sm": return "h-8 px-2";
      case "lg": return "h-12 px-4";
      default: return "h-10 px-3";
    }
  };
  
  // Share functions
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };
  
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(facebookUrl, '_blank');
  };
  
  const shareToLinkedin = () => {
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, '_blank');
  };
  
  const shareToInstagram = () => {
    // Instagram doesn't have a direct sharing URL like the others.
    // Usually, you would need to use their API.
    // For now, we'll show a toast with instructions.
    toast({
      title: "Instagram Sharing",
      description: "Take a screenshot of your activity and share it on Instagram with the provided text.",
    });
  };
  
  const copyToClipboard = () => {
    const shareText = `${title}\n${text}\n${url}`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast({
        title: "Link Copied",
        description: "Workout details copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    });
  };
  
  // Function to render sharing button with or without tooltip
  const renderShareButton = (
    platform: "twitter" | "facebook" | "linkedin" | "instagram" | "copy",
    icon: React.ReactNode,
    label: string,
    clickHandler: () => void
  ) => {
    const button = (
      <Button
        variant={variant}
        size="icon"
        className={`${getButtonSize()} ${platform === "twitter" ? "text-blue-400 hover:text-blue-500 hover:bg-blue-50" : 
                      platform === "facebook" ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : 
                      platform === "linkedin" ? "text-blue-700 hover:text-blue-800 hover:bg-blue-50" : 
                      platform === "instagram" ? "text-pink-500 hover:text-pink-600 hover:bg-pink-50" : 
                      "text-gray-600 hover:text-gray-700"}`}
        onClick={clickHandler}
      >
        {icon}
        {showLabel && <span className="ml-2">{label}</span>}
      </Button>
    );
    
    if (withTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on {label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return button;
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {platforms.includes("twitter") && renderShareButton(
        "twitter",
        <Twitter className={getIconSize()} />,
        "Twitter",
        shareToTwitter
      )}
      
      {platforms.includes("facebook") && renderShareButton(
        "facebook",
        <Facebook className={getIconSize()} />,
        "Facebook",
        shareToFacebook
      )}
      
      {platforms.includes("linkedin") && renderShareButton(
        "linkedin",
        <Linkedin className={getIconSize()} />,
        "LinkedIn",
        shareToLinkedin
      )}
      
      {platforms.includes("instagram") && renderShareButton(
        "instagram",
        <Instagram className={getIconSize()} />,
        "Instagram",
        shareToInstagram
      )}
      
      {platforms.includes("copy") && renderShareButton(
        "copy",
        <Link2 className={getIconSize()} />,
        "Copy Link",
        copyToClipboard
      )}
    </div>
  );
}

// Share button with text and icon
export function ShareButton({
  title,
  text,
  url,
  className = "",
  children,
}: SocialShareProps & { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className={`relative inline-block ${className}`}>
      <Button 
        variant="outline" 
        className="flex items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {children || "Share"}
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-white shadow-lg rounded-md border border-gray-200">
          <div className="mb-2 text-sm text-gray-600">Share via:</div>
          <SocialShare 
            title={title}
            text={text}
            url={url}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}