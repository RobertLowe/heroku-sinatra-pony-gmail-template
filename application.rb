require 'sinatra'
require 'haml'
require 'pony'

get '/' do
  haml :index, :locals => {:sent => false}
end

post '/' do
  @options = {
    :to => "Your Name <you@example.com>",
    :from => "example.com <you@example.com>",
    :subject=> "Contact Form",
    :body => "Budget: #{params[:project_budget]}\n\nDuration: #{params[:project_duration]}\n\nMessage: #{params[:message]}",
    :via => :smtp, :smtp => {
      :host => 'smtp.gmail.com',
      :port => '587',
      :user => 'you@example.com',
      :password => 'password',
      :auth => :plain,
      :domain => "example.com"
     },
    :headers => { "Reply-To" => params[:email] }
     
  }
  
  if params[:attachment] &&
     (tmpfile = params[:attachment][:tempfile]) &&
     (name = params[:attachment][:filename])
     
    @options[:attachments] = { name => tmpfile.read() }
  end

  Pony.mail(@options)
  
  haml :index, :locals => {:sent => true}
end
