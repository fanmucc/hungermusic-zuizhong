var EventCenter = {
    on: function(type,handler) {
        $(document).on(type,handler)
    },
    fire: function(type,data) {
        $(document).trigger(type, data)
    }
}

var Footer = {
    init: function() {
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    bind: function() {
        var _this = this
        this.$rightBtn.on('click',function() {
            if(this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToEnd) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                },400,function() {
                    _this.isAnimate = false
                    _this.isToStart = false
                    if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                        console.log('over')
                        _this.isToEnd = true
                    }
                })  
            }
        })

        
        this.$leftBtn.on('click',function() {
            if(this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+=' + rowCount * itemWidth
                },400,function() {
                    _this.isAnimate = false
                    _this.isToEnd = false
                    if(parseFloat(_this.$ul.css('left')) >= 0) {  
                        console.log('over')
                        _this.isToStart= true
                    }
                    console.log(_this.$ul.css('left'))
                    console.log(_this.$ul.css('width'))
                })  
            }
        })

        this.$footer.on('click','li',function() {
            $(this).addClass('active').siblings().removeClass('active')
            EventCenter.fire('select-albumn',{
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })
    },
    render: function() {
        var _this = this
        $.getJSON('http://api.jirengu.com/fm/getChannels.php')
            .done(function(red) {
                // console.log(red)  // 获取数据
                _this.renderFooter(red.channels)  // 部署DOM 
            }).fail(function() {
                console.log('error')
            })
    },
    // 生成DOM 
    renderFooter: function (channels) {
        console.log(channels)  
        var html =''
        // 遍历数组
        channels.forEach(function(channel){
           html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
                 + '<div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                 + '<h3>'+channel.name+'</h3>'
                 + '</li>'
        }) 
        this.$footer.find('ul').html(html)
        this.setStyle()
    },
    setStyle: function() {
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        this.$footer.find('ul').css({
            width: count * width + 'px'
        })
        console.log(this.$footer.find('ul').width())
    }
}

//渲染页面
 




var Fm = {
    init: function() {
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()
    },
    bind: function() {
        var _this = this
        EventCenter.on('select-albumn',function(e,channelObj){
            _this.channelId =channelObj.channelId
            _this.channelName =channelObj.channelName
            _this.loadMusic()
            // console.log('select',channelId)
        })

        this.$container.find('.btn-play').on('click',function() {
            var $btn = $(this)
            if($btn.hasClass('icon-play')) {
                $btn.removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()
            }else{
                $btn.removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()
            }
        })
        this.$container.find('.btn-next').on('click',function() {
            _this.loadMusic()
        })
        this.audio.addEventListener('play',function() {
            console.log('paly')
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function() {
                _this.updateStatus()
            },1000)
        }) 
        this.audio.addEventListener('pause',function() {
            clearInterval(_this.statusClock)
            console.log('pause')
        }) 
    },
    loadMusic(callback) {
        var _this = this
        console.log('aaa')
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId}).done(function(ret) {
            console.log(ret['song'][0])
            console.log(ret)
            _this.song = ret['song'][0]
            _this.setMusic()
            _this.lodLyric()
        }).fail(function() {
            console.log('error')
        })
    },
    lodLyric() {
        var _this = this
        console.log('aaa')
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid}).done(function(ret) {
            console.log(ret.lyric)
            console.log('歌词')
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach(function(line) {
                var times = line.match(/\d{2}:\d{2}/g)
                var str = line.replace(/\[.+?\]/g, '')
                if(Array.isArray(times)) {
                    times.forEach(function(time){
                        lyricObj[time] = str
                    })
                }
            })
            _this.lyricObj = lyricObj
        })
    },
    // 页面交互 歌曲信息 背景图片
    setMusic() {
        console.log('setMusic...')
        console.log(this.song)
        this.audio.src = this.song.url
        $('.bg').css('background-image','url('+this.song.picture+')')
        this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
        this.$container.find('.detail h1').text(this.song.title)
        this.$container.find('.detail .author').text(this.song.artist)
        this.$container.find('.detail .tag').text(this.channelName)
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
        
    },
    // 时间 与进度条 歌词
    updateStatus() {
        var min = Math.floor(this.audio.currentTime/60) 
        var second = Math.floor(Fm.audio.currentTime%60)+''
        second = second.length === 2?second:'0'+second
        this.$container.find('.current-time').text(min+':'+second)
        // 渲染进度条
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100+'%')
        // 进度条渲染成功后  可以进行拖拽

        var line = this.lyricObj['0'+min+':'+ second]
        if(line) {
            this.$container.find('.lyric p').text(line)
        }
        console.log(this.lyricObj['0'+min+':'+ second])
    }
    
}
Footer.init()
Fm.init()


